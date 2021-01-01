import type { ExecutionResult } from "graphql";
import {
  GraphQLClientWebSocket,
  SubscribePayload,
} from "./GraphQLClientWebSocket";
import { AsyncPushIterator } from "../util/AsyncPushIterator";

export interface GraphQLWebSocketClientOptions {
  url: string;
  protocol?: string;
  connectionInitPayload?: Record<string, unknown>;
  connect?: ConnectFn;
  minReconnectDelay?: number;
  maxReconnectDelay?: number;
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

export interface SubscribeOptions {
  maxRetries?: number;
  minRetryDelay?: number;
  maxRetryDelay?: number;
  delayMultiplier?: number;
}

export class GraphQLWebSocketClient {
  public readonly url: string;
  public readonly protocol: string;
  protected connectionInitPayload?: Record<string, unknown>;
  protected connectionAckPayload?: Record<string, unknown>;
  protected connect: ConnectFn;
  protected minReconnectDelay: number;
  protected maxReconnectDelay: number;
  protected reconnectDelayMultiplier: number;
  protected reconnectDelay: number;
  protected socket?: GraphQLClientWebSocket;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected subscriptions = new Set<AsyncPushIterator<any>>();

  constructor(options: GraphQLWebSocketClientOptions) {
    this.url = options.url;
    this.protocol = options.protocol ?? "graphql-transport-ws";
    this.connectionInitPayload = options.connectionInitPayload;

    this.connect =
      options.connect ??
      ((url, protocol, connectionInitPayload?) =>
        new GraphQLClientWebSocket({
          socket: new WebSocket(url, protocol),
        }).init(connectionInitPayload));

    this.minReconnectDelay = options.minReconnectDelay ?? 500;
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.reconnectDelayMultiplier = options.reconnectDelayMultiplier ?? 2;
    this.reconnectDelay = 0;
  }

  subscribe<TExecutionResult>(
    payload: SubscribePayload,
    options?: SubscribeOptions
  ) {
    return new AsyncPushIterator<TExecutionResult>(async (it) => {
      this.subscriptions.add(it);

      const run = async (retries: number) => {
        try {
          const socket = await this.requireConnection();
          const results = socket.subscribe<TExecutionResult>(payload);

          for await (const result of results) {
            it.push(result);
          }

          it.finish();
        } catch (err) {
          if (retries > 0 && this.shouldRetry(err)) {
            run(retries - 1);
          } else {
            it.throw(err);
          }
        }
      };

      run(options?.maxRetries ?? 0);

      return () => {
        this.subscriptions.delete(it);
      };
    });
  }

  close(code?: number, reason?: string) {
    this.socket?.close(code ?? 1000, reason ?? "Normal Closure");

    for (const subscription of this.subscriptions) {
      subscription.finish();
    }
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

    return true;
  }

  async requireConnection() {
    if (!this.socket || !this.socket.isOpenOrConnecting()) {
      if (this.reconnectDelay > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.reconnectDelay)
        );
      }

      this.socket = this.connect(
        this.url,
        this.protocol,
        this.connectionInitPayload
      );
    }

    try {
      this.connectionAckPayload = await this.socket.requireAck();
      this.reconnectDelay = this.minReconnectDelay;

      return this.socket;
    } catch (err) {
      this.reconnectDelay = Math.floor(
        Math.min(
          this.reconnectDelayMultiplier *
            Math.max(this.reconnectDelay, this.minReconnectDelay),
          this.maxReconnectDelay
        ) +
          Math.random() * this.minReconnectDelay
      );

      throw err;
    }
  }
}
