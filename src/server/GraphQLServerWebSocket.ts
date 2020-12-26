import {
  ExecutionResult,
  GraphQLError,
  GraphQLSchema,
  subscribe,
  parse,
  validate,
  getOperationAST,
} from "graphql";
import WebSocket from "ws";
import * as assert from "assert";
import { IncomingMessage } from "http";
import { isAsyncIterator } from "../util/misc";
import { DeferredPromise } from "../util/DeferredPromise";

export interface GraphQLServerWebSocketOptions<TContext> {
  socket: WebSocket;
  req: IncomingMessage;
  connectionInitWaitTimeout: number;
  acknowledgeFn: AcknowledgeFn<TContext>;
  schema: GraphQLSchema;
  context: TContext;
}

export type AcknowledgeFn<TContext> = (
  socket: GraphQLServerWebSocket<TContext>,
  payload?: Record<string, unknown>
) => Promise<Record<string, unknown> | undefined>;

export interface ConnectionInitMessage {
  payload?: Record<string, unknown>;
}

export interface ConnectionAckMessage {
  payload?: Record<string, unknown>;
}

export interface SubscribeMessage {
  id: string;
  payload: {
    operationName?: string;
    query: string;
    variables?: Record<string, unknown>;
  };
}

export interface NextMessage {
  id: string;
  payload: ExecutionResult;
}

export interface ErrorMessage {
  id: string;
  payload: readonly GraphQLError[];
}

export interface CompleteMessage {
  id: string;
}

export class GraphQLServerWebSocket<TContext> {
  public readonly socket: WebSocket;
  public readonly req: IncomingMessage;
  public readonly context: TContext;
  protected connectionInitWaitTimeout: NodeJS.Timeout;
  protected acknowledgeFn: AcknowledgeFn<TContext>;
  protected schema: GraphQLSchema;
  protected initialized = false;
  protected acknowledged = new DeferredPromise<boolean>();
  protected subscriptions = new Map<string, AsyncIterator<ExecutionResult>>();

  constructor(options: GraphQLServerWebSocketOptions<TContext>) {
    this.socket = options.socket;
    this.req = options.req;
    this.acknowledgeFn = options.acknowledgeFn;
    this.schema = options.schema;
    this.context = options.context;

    this.socket.on("message", (data) => this.onMessage(data));

    this.connectionInitWaitTimeout = setTimeout(() => {
      this.close(4408, "Connection initialisation timeout");
    }, options.connectionInitWaitTimeout);

    switch (this.socket.protocol) {
      case "graphql-transport-ws":
      case "graphql-ws": // legacy
        return new GraphQLServerWebSocket(options);
      default:
        options.socket.close(
          1002,
          `Unsupported sub-protocol ${options.socket.protocol}`
        );
    }
  }

  protected async onMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "connection_init":
          await this.onConnectionInit(message);
          break;
        case "subscribe":
        case "start": // legacy
          await this.onSubscribe(message);
          break;
        case "complete":
        case "stop": // legacy
          await this.onComplete(message);
          break;
        default:
          this.invalidMessage(`Invalid message type ${message.type}`);
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  protected async onConnectionInit(message: Record<string, unknown>) {
    if (message.payload) {
      assert.ok(typeof message.payload === "object");
      assert.ok(!Array.isArray(message.payload));
    }

    await this.handleConnectionInit(message as ConnectionInitMessage);
  }

  protected async handleConnectionInit(message: ConnectionInitMessage) {
    if (this.initialized) {
      return this.close(4429, "Too many initialisation requests");
    }

    clearTimeout(this.connectionInitWaitTimeout);
    this.initialized = true;

    let payload;

    try {
      payload = await this.acknowledgeFn(this, message.payload);
    } catch (err) {
      this.acknowledged.resolve(false);

      return this.close(4401, `Unauthorized: ${err.message}`);
    }

    await this.sendConnectionAck({ payload });
    this.acknowledged.resolve(true);
  }

  protected async sendConnectionAck(message: ConnectionAckMessage) {
    await this.send({ ...message, type: "connection_ack" });
  }

  protected async onSubscribe(message: Record<string, unknown>) {
    assert.strictEqual(typeof message.id, "string");
    assert.ok(message.payload);
    assert.ok(typeof message.payload === "object");
    assert.ok(!Array.isArray(message.payload));

    const payload = message.payload as Record<string, unknown>;

    if (payload.operationName) {
      assert.ok(typeof payload.operationName === "string");
    }

    assert.strictEqual(typeof payload.query, "string");

    if (payload.variables) {
      assert.ok(typeof payload.variables === "object");
      assert.ok(!Array.isArray(payload.variables));
    }

    await this.handleSubscribe((message as unknown) as SubscribeMessage);
  }

  protected async handleSubscribe(message: SubscribeMessage) {
    if (!(await this.acknowledged)) {
      return this.close(4401, "Unauthorized");
    }

    if (this.subscriptions.has(message.id)) {
      return this.close(4409, `Subscriber for ${message.id} already exists`);
    }

    const document = parse(message.payload.query);
    const validationErrors = validate(this.schema, document);

    if (validationErrors.length > 0) {
      return await this.sendError({
        id: message.id,
        payload: validationErrors,
      });
    }

    const operation = getOperationAST(document, message.payload.operationName);

    if (!operation) {
      return await this.sendError({
        id: message.id,
        payload: [
          new GraphQLError(
            `Undefined operation ${
              message.payload.operationName ?? "(no operations given)"
            }`
          ),
        ],
      });
    }

    if (operation.operation !== "subscription") {
      return await this.sendError({
        id: message.id,
        payload: [new GraphQLError("Only subscriptions are allowed")],
      });
    }

    const result = await subscribe({
      schema: this.schema,
      operationName: message.payload.operationName,
      document: document,
      variableValues: message.payload.variables,
      contextValue: this.context,
    });

    if (isAsyncIterator(result)) {
      this.subscriptions.set(message.id, result);

      for await (const r of result) {
        if (!this.isOpen()) break;

        await this.sendNext({ id: message.id, payload: r });
      }

      await this.sendComplete({ id: message.id });
    } else {
      await this.sendNext({ id: message.id, payload: result });
      await this.sendComplete({ id: message.id });
    }
  }

  protected async sendNext(message: NextMessage) {
    // legacy
    if (this.socket.protocol === "graphql-ws") {
      return this.send({
        ...message,
        type: "data",
      });
    }

    // standard
    await this.send({
      ...message,
      type: "next",
    });
  }

  protected async sendError(message: ErrorMessage) {
    await this.send({ ...message, type: "error" });
  }

  protected async onComplete(message: Record<string, unknown>) {
    assert.strictEqual(typeof message.id, "string");

    await this.handleComplete((message as unknown) as CompleteMessage);
  }

  protected async handleComplete(message: CompleteMessage) {
    if (!(await this.acknowledged)) {
      return this.close(4401, "Unauthorized");
    }

    this.stopSubscription(message.id);
  }

  protected async sendComplete(message: CompleteMessage) {
    this.stopSubscription(message.id);

    await this.send({ ...message, type: "complete" });
  }

  protected async send(message: unknown): Promise<void> {
    if (!this.isOpen()) return;

    return new Promise((resolve, reject) => {
      this.socket.send(JSON.stringify(message), (err) =>
        err ? reject(err) : resolve()
      );
    });
  }

  protected handleError(err: Error) {
    if (err instanceof assert.AssertionError) {
      this.invalidMessage(`Invalid message: ${err.message}`);
    } else {
      this.close(1011, `Unexpected error: ${err.message}`);
    }
  }

  protected invalidMessage(reason: string) {
    this.close(4400, reason);
  }

  close(code: number, reason: string) {
    clearTimeout(this.connectionInitWaitTimeout);
    this.acknowledged.resolve(false);

    if (this.isOpen()) this.socket.close(code, reason);

    for (const [id] of this.subscriptions) {
      try {
        this.stopSubscription(id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err.stack);
      }
    }
  }

  stopSubscription(id: string) {
    this.subscriptions.get(id)?.return?.();
    this.subscriptions.delete(id);
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }
}
