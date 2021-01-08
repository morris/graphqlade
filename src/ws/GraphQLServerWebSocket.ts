import type { ExecutionResult, GraphQLError } from "graphql";
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
  connectionInitWaitTimeout: number;
  acknowledge: AcknowledgeFn;
}

export type AcknowledgeFn = (
  socket: GraphQLServerWebSocket,
  connectionInitPayload?: Record<string, unknown> | null
) =>
  | Promise<Record<string, unknown> | null | undefined>
  | Record<string, unknown>
  | null
  | undefined;

export type SubscribeFn = (
  args: RawExecutionArgs,
  connectionInitPayload?: Record<string, unknown> | null
) => Promise<AsyncIterableIterator<ExecutionResult> | ExecutionResult>;

export class GraphQLServerWebSocket {
  public readonly socket: WebSocket;
  public readonly req: IncomingMessage;
  public readonly connectionInitWaitTimeout: number;
  protected subscribe: SubscribeFn;
  protected acknowledge: AcknowledgeFn;
  protected connectionInitWaitTimeoutId?: NodeJS.Timeout;
  protected initialized = false;
  protected connectionInitPayloadPromise = new DeferredPromise<
    Record<string, unknown> | null | undefined
  >();
  protected acknowledged = false;
  protected subscriptions = new Map<
    string,
    Promise<AsyncIterableIterator<ExecutionResult>>
  >();

  constructor(options: GraphQLServerWebSocketOptions) {
    this.socket = options.socket;
    this.req = options.req;
    this.connectionInitWaitTimeout = options.connectionInitWaitTimeout;
    this.acknowledge = options.acknowledge;
    this.subscribe = options.subscribe;

    // prevent uncaught exceptions
    this.connectionInitPayloadPromise.catch(() => {
      // ignore
    });

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

    this.connectionInitPayloadPromise.reject(
      new Error(`Web socket closed: ${code} ${reason}`)
    );

    for (const [, subscription] of this.subscriptions) {
      try {
        (await subscription).return?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `Could not return subscription iterator (on close): ${err.stack}`
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleError(err: Error) {
    if (this.connectionInitWaitTimeoutId) {
      clearTimeout(this.connectionInitWaitTimeoutId);
    }

    this.connectionInitPayloadPromise.reject(err);

    for (const [, subscription] of this.subscriptions) {
      try {
        (await subscription).return?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `Could not return subscription iterator (on error): ${err.stack}`
        );
      }
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

    let connectionAckPayload: Record<string, unknown> | null | undefined;

    try {
      connectionAckPayload = await this.acknowledge(this, message.payload);
      this.send({ type: "connection_ack", payload: connectionAckPayload });
      this.connectionInitPayloadPromise.resolve(message.payload);
      this.acknowledged = true;
    } catch (err) {
      const unauthorized = this.makeClosingError(
        4401,
        `Unauthorized: ${err.message}`
      );
      this.connectionInitPayloadPromise.reject(unauthorized);

      throw unauthorized;
    }
  }

  async handleSubscribeMessage(message: SubscribeMessage) {
    const connectionInitPayload = await this.requireAck();

    if (this.subscriptions.has(message.id)) {
      throw this.makeClosingError(
        4409,
        `Subscriber for ${message.id} already exists`
      );
    }

    const promise = this.subscribe(message.payload, connectionInitPayload).then(
      async (result) => {
        if (isAsyncIterator(result)) {
          (async () => {
            try {
              for await (const r of result) {
                this.send({ type: "next", id: message.id, payload: r });
              }

              this.send({ type: "complete", id: message.id });
            } catch (err) {
              this.send({
                type: "error",
                id: message.id,
                payload: [{ message: err.message } as GraphQLError],
              });
            } finally {
              setTimeout(() => {
                this.subscriptions.delete(message.id);
              }, 3000);
            }
          })();

          return result;
        } else {
          assertDefined(
            result.errors,
            "Received non-async-iterable without errors"
          );

          this.send({
            type: "error",
            id: message.id,
            payload: result.errors,
          });

          return {} as AsyncIterableIterator<ExecutionResult>;
        }
      }
    );

    this.subscriptions.set(message.id, promise);
  }

  async handleCompleteMessage(message: CompleteMessage) {
    await this.requireAck();

    const subscription = await this.requireSubscription(message.id);

    subscription.return?.();
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
    if (this.socket.protocol === "graphql-ws-transport" && !this.acknowledged) {
      throw this.makeClosingError(4401, "Unauthorized");
    }

    return this.connectionInitPayloadPromise;
  }

  async requireSubscription(id: string) {
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
      // eslint-disable-next-line no-console
      console.error(err.stack);
      this.close(1011, `Internal server error: ${err.message}`);
    }
  }

  makeClosingError(code: number, reason: string) {
    return Object.assign(new Error(reason), { code });
  }

  send(message: GraphQLWebSocketServerMessage) {
    if (!this.isOpen()) return;

    this.socket.send(JSON.stringify(message));
  }

  close(code: number, reason: string) {
    if (this.isOpen()) this.socket.close(code, reason);
  }

  isOpen() {
    return this.socket.readyState === this.socket.OPEN;
  }
}
