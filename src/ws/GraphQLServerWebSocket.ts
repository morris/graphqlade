import { ExecutionResult } from "graphql";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import { isAsyncIterator } from "../util/misc";
import { DeferredPromise } from "../util/DeferredPromise";
import {
  CompleteMessage,
  ConnectionInitMessage,
  GraphQLWebSocketServerMessage,
  SubscribeMessage,
} from "./GraphQLWebSocketMessage";
import { assertType, assertRecord, assertDefined } from "../util/assert";
import { RawExecutionArgs } from "../server/GraphQLExecutionArgsParser";

export interface GraphQLServerWebSocketOptions {
  socket: WebSocket;
  req: IncomingMessage;
  connectionInitWaitTimeout?: number;
  acknowledge?: AcknowledgeFn;
  subscribe: SubscribeFn;
}

export type AcknowledgeFn = (
  socket: GraphQLServerWebSocket,
  payload?: Record<string, unknown> | null
) =>
  | Promise<Record<string, unknown> | null | undefined>
  | Record<string, unknown>
  | null
  | undefined;

export type SubscribeFn = (
  args: RawExecutionArgs
) => Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;

export class GraphQLServerWebSocket {
  public readonly socket: WebSocket;
  public readonly req: IncomingMessage;
  public readonly connectionInitWaitTimeout: number;
  protected acknowledge: AcknowledgeFn;
  protected subscribe: SubscribeFn;
  protected connectionInitWaitTimeoutId?: NodeJS.Timeout;
  protected initialized = false;
  protected acknowledged = false;
  protected acknowledgement = new DeferredPromise<boolean>();
  protected subscriptions = new Map<
    string,
    AsyncIterableIterator<ExecutionResult>
  >();

  constructor(options: GraphQLServerWebSocketOptions) {
    this.socket = options.socket;
    this.req = options.req;
    this.connectionInitWaitTimeout = options.connectionInitWaitTimeout ?? 3000;
    this.acknowledge = options.acknowledge ?? (() => null);
    this.subscribe = options.subscribe;

    this.setup();
  }

  protected setup() {
    switch (this.socket.protocol) {
      case "graphql-transport-ws":
      case "graphql-ws": // legacy
        this.socket.on("message", (data) => this.onMessage(data));

        this.connectionInitWaitTimeoutId = setTimeout(() => {
          this.close(4408, "Connection initialisation timeout");
        }, this.connectionInitWaitTimeout);
        break;
      default:
        this.close(1002, `Unsupported sub-protocol ${this.socket.protocol}`);
    }
  }

  protected async onMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());

      assertRecord(message);

      switch (message.type) {
        case "connection_init":
          await this.onConnectionInit(this.parseConnectionInit(message));
          break;
        case "subscribe":
        case "start": // legacy
          await this.onSubscribe(this.parseSubscribe(message));
          break;
        case "complete":
        case "stop": // legacy
          await this.onComplete(this.parseComplete(message));
          break;
        default:
          this.invalidMessage(`Invalid message type ${message.type}`);
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  // parse

  parseConnectionInit(message: Record<string, unknown>): ConnectionInitMessage {
    if (typeof message.payload !== "undefined" && message.payload !== null) {
      assertRecord(message.payload);
    }

    return {
      type: "connection_init",
      payload: message.payload,
    };
  }

  parseSubscribe(message: Record<string, unknown>): SubscribeMessage {
    assertType(typeof message.id === "string");
    assertRecord(message.payload);

    const payload = message.payload;

    assertType(typeof payload.query === "string");

    if (
      typeof payload.operationName !== "undefined" &&
      payload.operationName !== null
    ) {
      assertType(typeof payload.operationName === "string");
    }

    if (
      typeof payload.variables !== "undefined" &&
      payload.variables !== null
    ) {
      assertRecord(payload.variables);
    }

    return {
      type: "subscribe",
      id: message.id,
      payload: {
        query: payload.query,
        operationName: payload.operationName,
        variables: payload.variables,
      },
    };
  }

  parseComplete(message: Record<string, unknown>): CompleteMessage {
    assertType(typeof message.id === "string");

    return {
      type: "complete",
      id: message.id,
    };
  }

  // handle

  protected async onConnectionInit(message: ConnectionInitMessage) {
    if (this.initialized) {
      return this.close(4429, "Too many initialization requests");
    }

    this.initialized = true;

    if (this.connectionInitWaitTimeoutId) {
      clearTimeout(this.connectionInitWaitTimeoutId);
    }

    let payload: Record<string, unknown> | null | undefined;

    try {
      payload = await this.acknowledge(this, message.payload);
    } catch (err) {
      this.acknowledged = false;
      this.acknowledgement.reject(false);

      return this.close(4401, `Unauthorized: ${err.message}`);
    }

    await this.send({ type: "connection_ack", payload });
    this.acknowledged = true;
    this.acknowledgement.resolve(true);
  }

  protected async onSubscribe(message: SubscribeMessage) {
    if (!(await this.requireAck())) return;

    if (this.subscriptions.has(message.id)) {
      return this.close(4409, `Subscriber for ${message.id} already exists`);
    }

    const result = await this.subscribe(message.payload);

    if (isAsyncIterator(result)) {
      this.subscriptions.set(message.id, result);

      for await (const r of result) {
        if (!this.isOpen()) break;

        await this.send({ type: "next", id: message.id, payload: r });
      }

      await this.send({ type: "complete", id: message.id });
      this.subscriptions.delete(message.id);
    } else {
      assertDefined(
        result.errors,
        "Received non-async-interable without errors"
      );

      await this.send({
        type: "error",
        id: message.id,
        payload: result.errors,
      });
    }
  }

  protected async onComplete(message: CompleteMessage) {
    if (!(await this.requireAck())) return;

    this.stopSubscription(message.id);
  }

  // helpers

  async requireAck() {
    if (
      (this.socket.protocol === "graphql-ws-transport" && !this.acknowledged) ||
      (this.socket.protocol === "graphql-ws" && !(await this.acknowledgement))
    ) {
      this.close(4401, "Unauthorized");

      return false;
    }

    return true;
  }

  protected async send(message: GraphQLWebSocketServerMessage): Promise<void> {
    if (!this.isOpen()) return;

    const data = JSON.stringify(message);

    return new Promise((resolve, reject) => {
      this.socket.send(data, (err) => (err ? reject(err) : resolve()));
    });
  }

  protected handleError(err: Error) {
    if (err instanceof TypeError) {
      this.invalidMessage(`Invalid message: ${err.message}`);
    } else {
      this.close(1011, `Unexpected error: ${err.message}`);
    }
  }

  protected invalidMessage(reason: string) {
    this.close(4400, reason);
  }

  close(code: number, reason: string) {
    if (this.isOpen()) this.socket.close(code, reason);

    clearTimeout(this.connectionInitWaitTimeout);
    this.acknowledged = false;
    this.acknowledgement.resolve(false);

    for (const [id] of this.subscriptions) {
      try {
        this.stopSubscription(id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err.stack);
      }
    }
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }

  protected stopSubscription(id: string) {
    const subscription = this.subscriptions.get(id);

    if (subscription) {
      subscription.return?.();
      this.subscriptions.delete(id);
    }
  }
}
