// keep granular imports here for browser build
import type { ExecutionResult } from "graphql";
import { assert, assertRecord } from "../util/assert";
import { AsyncPushIterator } from "../util/AsyncPushIterator";
import { DeferredPromise } from "../util/DeferredPromise";
import { toError } from "../util/toError";
import type {
  CompleteMessage,
  ConnectionAckMessage,
  ErrorMessage,
  GraphQLWebSocketClientMessage,
  NextMessage,
  SubscribeMessage,
} from "./GraphQLWebSocketMessage";

export interface GraphQLClientWebSocketOptions {
  socket: WebSocketLike;
  connectionAckTimeout: number;
}

export type WebSocketLike = Pick<
  WebSocket,
  "addEventListener" | "send" | "close" | "readyState" | "OPEN" | "CONNECTING"
>;

export type SubscribePayload = SubscribeMessage["payload"];

export class GraphQLClientWebSocket {
  public readonly socket: WebSocketLike;
  protected connectionAckWaitTimeout: number;
  protected connectionAckWaitTimeoutId?: NodeJS.Timeout;
  protected connectionAckPayloadPromise = new DeferredPromise<
    Record<string, unknown> | null | undefined
  >();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected subscriptions = new Map<string, AsyncPushIterator<any>>();
  protected nextSubscriptionId = 1;

  constructor(options: GraphQLClientWebSocketOptions) {
    this.socket = options.socket;
    this.connectionAckWaitTimeout = options.connectionAckTimeout;

    this.setup();
  }

  init(connectionInitPayload?: Record<string, unknown>) {
    this.connectionAckWaitTimeoutId = setTimeout(() => {
      this.close(4408, "Connection acknowledgement timeout");
    }, this.connectionAckWaitTimeout);

    if (this.isOpen()) {
      this.send({
        type: "connection_init",
        payload: connectionInitPayload,
      });
    } else {
      this.socket.addEventListener("open", () => {
        this.send({
          type: "connection_init",
          payload: connectionInitPayload,
        });
      });
    }

    return this;
  }

  subscribe<TData>(payload: SubscribePayload) {
    return new AsyncPushIterator<
      // TODO remove support for passing execution result type in 2.0?
      TData extends ExecutionResult ? TData : ExecutionResult<TData>
    >(async (it) => {
      await this.requireAck();

      const id = (this.nextSubscriptionId++).toString();
      this.subscriptions.set(id, it);

      this.send({
        type: "subscribe",
        id,
        payload,
      });

      return () => {
        this.send({ type: "complete", id });
        setTimeout(() => {
          this.subscriptions.delete(id);
        }, 3000);
      };
    });
  }

  // event handlers

  async handleCloseEvent(event: CloseEvent) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
    }

    this.connectionAckPayloadPromise.reject(
      this.makeClosingError(event.code, event.reason)
    );

    for (const [, subscription] of this.subscriptions) {
      subscription.throw(this.makeClosingError(event.code, event.reason));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleErrorEvent(event: Event) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
    }

    this.connectionAckPayloadPromise.reject(
      this.makeClosingError(-1, "Web socket error")
    );

    for (const [, subscription] of this.subscriptions) {
      subscription.throw(this.makeClosingError(-1, "Web socket error"));
    }
  }

  async handleMessageEvent(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data.toString());

      assertRecord(message);

      switch (message.type) {
        case "connection_ack":
          this.handleConnectionAckMessage(
            this.parseConnectionAckMessage(message)
          );
          break;
        case "next":
        case "data": // legacy
          this.handleNextMessage(this.parseNextMessage(message));
          break;
        case "error":
          this.handleErrorMessage(this.parseErrorMessage(message));
          break;
        case "complete":
        case "stop": // legacy
          this.handleCompleteMessage(this.parseCompleteMessage(message));
          break;
        default:
          this.close(4400, `Invalid message type ${message.type}`);
      }
    } catch (err) {
      this.closeByError(toError(err));
    }
  }

  // message handlers

  handleConnectionAckMessage(message: ConnectionAckMessage) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
      this.connectionAckWaitTimeoutId = undefined;
    }

    this.connectionAckPayloadPromise.resolve(message.payload);
  }

  handleNextMessage(message: NextMessage) {
    this.requireSubscription(message.id).push(message.payload);
  }

  handleErrorMessage(message: ErrorMessage) {
    this.requireSubscription(message.id).throw(
      new Error(
        `Subscription error: ${message.payload
          .map((it) => it.message)
          .join(" / ")}`
      )
    );
  }

  handleCompleteMessage(message: CompleteMessage) {
    this.requireSubscription(message.id).finish();
  }

  // message parsers

  parseConnectionAckMessage(
    message: Record<string, unknown>
  ): ConnectionAckMessage {
    if (typeof message.payload !== "undefined" && message.payload !== null) {
      assertRecord(message.payload);
    }

    return {
      type: "connection_ack",
      payload: message.payload,
    };
  }

  parseNextMessage(message: Record<string, unknown>): NextMessage {
    assert(typeof message.id === "string");
    assertRecord(message.payload);

    return {
      type: "next",
      id: message.id,
      payload: message.payload,
    };
  }

  parseErrorMessage(message: Record<string, unknown>): ErrorMessage {
    assert(typeof message.id === "string");
    assert(Array.isArray(message.payload));

    for (const error of message.payload) {
      assert(typeof error.message === "string");
    }

    return {
      type: "error",
      id: message.id,
      payload: message.payload,
    };
  }

  parseCompleteMessage(message: Record<string, unknown>): CompleteMessage {
    assert(typeof message.id === "string");

    return {
      type: "complete",
      id: message.id,
    };
  }

  // helpers

  async requireAck() {
    const payload = await this.connectionAckPayloadPromise;

    return payload ?? undefined;
  }

  requireSubscription(id: string) {
    const subscription = this.subscriptions.get(id);

    if (!subscription) {
      throw this.makeClosingError(4409, `Subscriber for ${id} does not exist`);
    }

    return subscription;
  }

  // low-level

  protected setup() {
    this.socket.addEventListener("close", (e) => this.handleCloseEvent(e));
    this.socket.addEventListener("error", (e) => this.handleErrorEvent(e));
    this.socket.addEventListener("message", (e) => this.handleMessageEvent(e));
  }

  closeByError(err: Error & { code?: number }) {
    if (typeof err.code === "number") {
      this.close(err.code, err.message);
    } else if (err instanceof TypeError) {
      this.close(4400, `Invalid message: ${err.message}`);
    } else {
      // TODO 4500 is non-standard, need alignment here
      this.close(4500, `Client error: ${err.message}`);
    }
  }

  send(message: GraphQLWebSocketClientMessage) {
    if (this.isOpen()) this.socket.send(JSON.stringify(message));
  }

  close(code: number, reason: string) {
    if (this.connectionAckWaitTimeoutId) {
      clearTimeout(this.connectionAckWaitTimeoutId);
    }

    if (this.isOpenOrConnecting()) this.socket.close(code, reason);
  }

  isOpenOrConnecting() {
    return (
      this.socket.readyState === this.socket.OPEN ||
      this.socket.readyState === this.socket.CONNECTING
    );
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }

  makeClosingError(code: number, reason: string) {
    return Object.assign(new Error(reason), { code });
  }
}
