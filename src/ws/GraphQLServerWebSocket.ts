import type { ExecutionResult } from "graphql";
import type WebSocket from "ws";
import type { IncomingMessage } from "http";
import type {
  CompleteMessage,
  ConnectionInitMessage,
  GraphQLWebSocketServerMessage,
  SubscribeMessage,
} from "./GraphQLWebSocketMessage";
import type { RawExecutionArgs } from "../server/GraphQLExecutionArgsParser";
import { isAsyncIterator } from "../util/misc";
import { DeferredPromise } from "../util/DeferredPromise";

import { assertType, assertRecord, assertDefined } from "../util/assert";

export interface GraphQLServerWebSocketOptions {
  socket: WebSocket;
  req: IncomingMessage;
  subscribe: SubscribeFn;
  connectionInitWaitTimeout?: number;
  acknowledge?: AcknowledgeFn;
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
  protected subscribe: SubscribeFn;
  protected acknowledge: AcknowledgeFn;
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
        this.socket.on("close", (code, reason) =>
          this.handleClose(code, reason)
        );
        this.socket.on("error", (error) => this.handleError(error));
        this.socket.on("message", (data) => this.handleMessage(data));

        this.connectionInitWaitTimeoutId = setTimeout(() => {
          this.close(4408, "Connection initialization timeout");
        }, this.connectionInitWaitTimeout);
        break;
      default:
        this.close(
          1002,
          `Unsupported web socket protocol ${this.socket.protocol}`
        );
    }
  }

  // event handlers

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleClose(code: number, reason: string) {
    if (this.connectionInitWaitTimeoutId) {
      clearTimeout(this.connectionInitWaitTimeoutId);
    }

    this.acknowledged = false;
    this.acknowledgement.resolve(false);

    for (const [, subscription] of this.subscriptions) {
      subscription.return?.();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleError(err: Error) {
    if (this.connectionInitWaitTimeoutId) {
      clearTimeout(this.connectionInitWaitTimeoutId);
    }

    this.acknowledged = false;
    this.acknowledgement.resolve(false);

    for (const [, subscription] of this.subscriptions) {
      subscription.return?.();
    }
  }

  async handleMessage(data: WebSocket.Data) {
    try {
      const message = JSON.parse(data.toString());

      assertRecord(message);

      switch (message.type) {
        case "connection_init":
          await this.handleConnectionInitMessage(
            this.parseConnectionInitMessage(message)
          );
          break;
        case "subscribe":
        case "start": // legacy
          await this.handleSubscribeMessage(
            this.parseSubscribeMessage(message)
          );
          break;
        case "complete":
        case "stop": // legacy
          await this.handleCompleteMessage(this.parseCompleteMessage(message));
          break;
        default:
          this.close(4400, `Invalid message type: ${message.type}`);
      }
    } catch (err) {
      this.closeByError(err);
    }
  }

  // message handlers

  async handleConnectionInitMessage(message: ConnectionInitMessage) {
    if (this.initialized) {
      throw this.makeClosingError(4429, "Too many initialization requests");
    }

    this.initialized = true;

    if (this.connectionInitWaitTimeoutId) {
      clearTimeout(this.connectionInitWaitTimeoutId);
      this.connectionInitWaitTimeoutId = undefined;
    }

    let payload: Record<string, unknown> | null | undefined;

    try {
      payload = await this.acknowledge(this, message.payload);
      await this.send({ type: "connection_ack", payload });
      this.acknowledged = true;
      this.acknowledgement.resolve(true);
    } catch (err) {
      this.acknowledged = false;
      this.acknowledgement.resolve(false);
    }
  }

  async handleSubscribeMessage(message: SubscribeMessage) {
    await this.requireAck();

    if (this.subscriptions.has(message.id)) {
      throw this.makeClosingError(
        4409,
        `Subscriber for ${message.id} already exists`
      );
    }

    const result = await this.subscribe(message.payload);

    if (isAsyncIterator(result)) {
      this.subscriptions.set(message.id, result);

      try {
        for await (const r of result) {
          if (!this.isOpen()) break;

          await this.send({ type: "next", id: message.id, payload: r });
        }

        await this.send({ type: "complete", id: message.id });
      } finally {
        setTimeout(() => {
          this.subscriptions.delete(message.id);
        }, 3000);
      }
    } else {
      assertDefined(
        result.errors,
        "Received non-async-iterable without errors"
      );

      await this.send({
        type: "error",
        id: message.id,
        payload: result.errors,
      });
    }
  }

  async handleCompleteMessage(message: CompleteMessage) {
    await this.requireAck();

    this.requireSubscription(message.id).return?.();
  }

  // message parsers

  parseConnectionInitMessage(
    message: Record<string, unknown>
  ): ConnectionInitMessage {
    if (typeof message.payload !== "undefined" && message.payload !== null) {
      assertRecord(message.payload);
    }

    return {
      type: "connection_init",
      payload: message.payload,
    };
  }

  parseSubscribeMessage(message: Record<string, unknown>): SubscribeMessage {
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

  parseCompleteMessage(message: Record<string, unknown>): CompleteMessage {
    assertType(typeof message.id === "string");

    return {
      type: "complete",
      id: message.id,
    };
  }

  // helpers

  async requireAck() {
    if (
      (this.socket.protocol === "graphql-ws-transport" && !this.acknowledged) ||
      (this.socket.protocol === "graphql-ws" && !(await this.acknowledgement))
    ) {
      throw this.makeClosingError(4401, "Unauthorized");
    }
  }

  requireSubscription(id: string) {
    const subscription = this.subscriptions.get(id);

    if (!subscription) {
      throw this.makeClosingError(4409, `Subscriber for ${id} does not exist`);
    }

    return subscription;
  }

  // low-level

  closeByError(err: Error & { code?: number }) {
    if (typeof err.code === "number") {
      this.close(err.code, err.message);
    } else if (err instanceof TypeError) {
      this.close(4400, `Invalid message: ${err.message}`);
    } else {
      this.close(1011, `Internal server error: ${err.message}`);
    }
  }

  makeClosingError(code: number, reason: string) {
    return Object.assign(new Error(reason), { code });
  }

  async send(message: GraphQLWebSocketServerMessage): Promise<void> {
    if (!this.isOpen()) return;

    const data = JSON.stringify(message);

    return new Promise((resolve, reject) => {
      this.socket.send(data, (err) => (err ? reject(err) : resolve()));
    });
  }

  close(code: number, reason: string) {
    if (this.isOpen()) this.socket.close(code, reason);
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }
}
