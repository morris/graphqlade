import type { ExecutionResult } from "graphql";
import {
  GraphQLClientWebSocket,
  SubscribePayload,
} from "./GraphQLClientWebSocket";
import { AsyncPushIterator } from "../util/AsyncPushIterator";

export interface GraphQLWebSocketClientOptions {
  /**
   * URL to GraphQL API.
   */
  url: string;

  /**
   * WebSocket sub-protocol to use.
   * Either "graphql-transport-ws" or "graphql-ws" (legacy).
   * Defaults to "graphql-transport-ws".
   */
  protocol?: string;

  /**
   * Payload to send during initialization.
   * May be used server-side to acknowledge the connection.
   */
  connectionInitPayload?: Record<string, unknown>;

  /**
   * Timeout to receive acknowledgement, in milliseconds.
   * Defaults to 3000.
   */
  connectionAckTimeout?: number;

  /**
   * Overrides the basic connection function.
   * For example, when GraphQLWebSocketClient on server-side, you'd need
   * to create a WebSocket from "ws" instead of a standard WebSocket.
   */
  connect?: ConnectFn;

  /**
   * Should the client automatically reconnect on normal socket closure?
   * Defaults to true.
   */
  autoReconnect?: boolean;

  /**
   * Minimum delay to wait before reconnection, in milliseconds.
   * Reconnections only happen with open subscriptions and are controlled
   * per subscription (see GraphQLWebSocketClient.subscribe()).
   * The minimum is 10.
   * Defaults to 500.
   */
  minReconnectDelay?: number;

  /**
   * Maximum delay to wait before reconnection, in milliseconds.
   * Defaults to 30000.
   */
  maxReconnectDelay?: number;

  /**
   * Reconnection delay multiplier.
   * Defaults to 2 (for exponential back-off).
   */
  reconnectDelayMultiplier?: number;
}

export type ConnectFn = (
  url: string,
  protocol: string,
  connectionInitPayload?: Record<string, unknown>
) => GraphQLClientWebSocket;

export interface SubscriptionRef {
  payload: SubscribePayload;
  iterator: AsyncPushIterator<ExecutionResult>;
}

export class GraphQLWebSocketClient {
  public readonly url: string;
  public readonly protocol: string;
  public gqlSocket?: GraphQLClientWebSocket;
  protected connectionInitPayload?: Record<string, unknown>;
  protected connectionAckTimeout: number;
  protected connectionAckPayload?: Record<string, unknown>;
  protected connect: ConnectFn;
  protected autoReconnect: boolean;
  protected minReconnectDelay: number;
  protected maxReconnectDelay: number;
  protected reconnectDelayMultiplier: number;
  protected reconnectDelay: number;
  protected reconnectDelayPromise?: Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected subscriptions = new Set<AsyncPushIterator<any>>();

  constructor(options: GraphQLWebSocketClientOptions) {
    this.url = options.url;
    this.protocol = options.protocol ?? "graphql-transport-ws";
    this.connectionInitPayload = options.connectionInitPayload;
    this.connectionAckTimeout = options.connectionAckTimeout ?? 3000;

    this.connect =
      options.connect ??
      ((url, protocol, connectionInitPayload?) =>
        new GraphQLClientWebSocket({
          socket: new WebSocket(url, protocol),
          connectionAckTimeout: this.connectionAckTimeout,
        }).init(connectionInitPayload));

    this.autoReconnect = options.autoReconnect !== false;
    this.minReconnectDelay = Math.max(options.minReconnectDelay ?? 500, 10);
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.reconnectDelayMultiplier = options.reconnectDelayMultiplier ?? 2;
    this.reconnectDelay = 0;
  }

  subscribe<TExecutionResult>(payload: SubscribePayload) {
    return new AsyncPushIterator<TExecutionResult>(async (it) => {
      this.subscriptions.add(it);

      const run = async () => {
        try {
          const socket = await this.requireConnection();
          const results = socket.subscribe<TExecutionResult>(payload);

          for await (const result of results) {
            it.push(result);
          }

          it.finish();
        } catch (err) {
          if (this.shouldRetry(err)) {
            run();
          } else {
            it.throw(err);
          }
        }
      };

      run();

      return () => {
        this.subscriptions.delete(it);
      };
    });
  }

  close(code?: number, reason?: string) {
    for (const subscription of this.subscriptions) {
      subscription.finish();
    }

    this.gqlSocket?.close(code ?? 1000, reason ?? "Normal Closure");
  }

  shouldRetry(err: Error & { code?: number }) {
    switch (err.code) {
      case 1002:
      case 1011:
      case 4400:
      case 4401:
      case 4409:
      case 4429:
        return false;
    }

    return typeof err.code === "number";
  }

  async requireConnection() {
    await this.maybeDelayReconnect();

    if (!this.gqlSocket || !this.gqlSocket.isOpenOrConnecting()) {
      this.gqlSocket = this.connect(
        this.url,
        this.protocol,
        this.connectionInitPayload
      );
    }

    try {
      this.connectionAckPayload = await this.gqlSocket.requireAck();
      this.resetReconnectDelay();

      return this.gqlSocket;
    } catch (err) {
      this.increaseReconnectDelay();

      throw err;
    }
  }

  protected async maybeDelayReconnect() {
    if (this.gqlSocket?.isOpenOrConnecting()) return;
    if (this.reconnectDelay === 0) return;

    if (!this.reconnectDelayPromise) {
      this.reconnectDelayPromise = new Promise((resolve) => {
        setTimeout(resolve, this.reconnectDelay);
      });
    }

    if (this.reconnectDelayPromise) {
      await this.reconnectDelayPromise;
      this.reconnectDelayPromise = undefined;
    }
  }

  protected resetReconnectDelay() {
    this.reconnectDelay = this.minReconnectDelay;
  }

  protected increaseReconnectDelay() {
    this.reconnectDelay = Math.floor(
      Math.min(
        this.reconnectDelayMultiplier *
          Math.max(this.reconnectDelay, this.minReconnectDelay),
        this.maxReconnectDelay
      ) +
        Math.random() * this.minReconnectDelay
    );
  }
}
