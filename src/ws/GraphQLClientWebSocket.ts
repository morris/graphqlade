import type { ExecutionResult, GraphQLError } from "graphql";
import type {
  CompleteMessage,
  ConnectionAckMessage,
  ErrorMessage,
  GraphQLWebSocketClientMessage,
  NextMessage,
  SubscribeMessage,
} from "./GraphQLWebSocketMessage";
import { DeferredPromise } from "../util/DeferredPromise";
import { assertType, assertRecord } from "../util/assert";

export interface GraphQLClientWebSocketOptions {
  socket: WebSocket;
  connectionInitPayload?: Record<string, unknown>;
}

export interface ClientSubscriptionRef {
  complete(): void;
}

export interface ClientSubscription<TData, TExtensions> {
  next(value: ExecutionResult<TData, TExtensions>): void;
  error(error: readonly GraphQLError[]): void;
  complete(): void;
}

export class GraphQLClientWebSocket<TExtensions> {
  public readonly socket: WebSocket;
  protected connectionInitPayload?: Record<string, unknown>;
  protected initialized = false;
  protected acknowledged = new DeferredPromise<
    Record<string, unknown> | null | undefined
  >();
  protected subscriptions = new Map<
    string,
    ClientSubscription<unknown, TExtensions>
  >();
  protected nextSubscriptionId = 1;

  constructor(options: GraphQLClientWebSocketOptions) {
    this.socket = options.socket;
    this.connectionInitPayload = options.connectionInitPayload;

    this.setup();
  }

  protected setup() {
    this.socket.addEventListener("open", () => {
      this.socket.addEventListener("message", (e) => this.onMessage(e));
      this.send({
        type: "connection_init",
        payload: this.connectionInitPayload,
      });
    });
  }

  // actions

  async subscribe<TData>(
    payload: SubscribeMessage["payload"],
    sink: ClientSubscription<TData, TExtensions>
  ): Promise<ClientSubscriptionRef> {
    await this.acknowledged;

    const id = (this.nextSubscriptionId++).toString();

    this.subscriptions.set(id, sink);

    this.send({
      type: "subscribe",
      id,
      payload,
    });

    return {
      complete: () => {
        this.send({ type: "complete", id });
        this.stopSubscription(id);
      },
    };
  }

  protected async onMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data.toString());

      assertRecord(message);

      switch (message.type) {
        case "connection_ack":
          this.onConnectionAck(this.parseConnectionAck(message));
          break;
        case "next":
        case "data": // legacy
          this.onNext(this.parseNext(message));
          break;
        case "error":
          this.onError(this.parseError(message));
          break;
        case "complete":
        case "stop": // legacy
          this.onComplete(this.parseComplete(message));
          break;
        default:
          this.invalidMessage(`Invalid message type ${message.type}`);
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  // parsers

  parseConnectionAck(message: Record<string, unknown>): ConnectionAckMessage {
    if (typeof message.payload !== "undefined" && message.payload !== null) {
      assertRecord(message.payload);
    }

    return {
      type: "connection_ack",
      payload: message.payload,
    };
  }

  parseNext(message: Record<string, unknown>): NextMessage {
    assertType(typeof message.id === "string");
    assertRecord(message.payload);

    return {
      type: "next",
      id: message.id,
      payload: message.payload,
    };
  }

  parseError(message: Record<string, unknown>): ErrorMessage {
    assertType(typeof message.id === "string");
    assertType(Array.isArray(message.payload));

    for (const error of message.payload) {
      assertType(typeof error.message === "string");
    }

    return {
      type: "error",
      id: message.id,
      payload: message.payload,
    };
  }

  parseComplete(message: Record<string, unknown>): CompleteMessage {
    assertType(typeof message.id === "string");

    return {
      type: "complete",
      id: message.id,
    };
  }

  // handlers

  protected onConnectionAck(message: ConnectionAckMessage) {
    this.acknowledged.resolve(message.payload);
  }

  protected onNext(message: NextMessage) {
    const subscription = this.subscriptions.get(message.id);

    if (!subscription) {
      return this.close(4409, `Subscriber for ${message.id} does not exist`);
    }

    subscription.next(message.payload as ExecutionResult<unknown, TExtensions>);
  }

  protected onError(message: ErrorMessage) {
    const subscription = this.subscriptions.get(message.id);

    if (!subscription) {
      return this.close(4409, `Subscriber for ${message.id} does not exist`);
    }

    subscription.error(message.payload);
    this.stopSubscription(message.id);
  }

  protected onComplete(message: CompleteMessage) {
    this.stopSubscription(message.id);
  }

  protected send(message: GraphQLWebSocketClientMessage) {
    if (!this.isOpen()) return;

    const data = JSON.stringify(message);

    this.socket.send(data);
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

  close(code?: number, reason?: string) {
    if (this.isOpen()) {
      this.socket.close(code ?? 1000, reason ?? "Normal Closure");
    }

    for (const [id] of this.subscriptions) {
      try {
        this.stopSubscription(id);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err.stack);
      }
    }
  }

  protected stopSubscription(id: string) {
    const subscription = this.subscriptions.get(id);

    if (subscription) {
      subscription.complete();
      this.subscriptions.delete(id);
    }
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }
}
