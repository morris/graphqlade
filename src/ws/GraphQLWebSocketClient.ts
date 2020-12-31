import type { ExecutionResult } from "graphql";
import {
  GraphQLClientWebSocket,
  SubscribePayload,
} from "./GraphQLClientWebSocket";
import { AsyncPushIterator } from "../util/AsyncPushIterator";

export interface GraphQLWebSocketClientOptions {
  url: string;
  protocol: string;
  connectionInitPayload?: Record<string, unknown>;
  connect?: ConnectFn;
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
  protected socket?: GraphQLClientWebSocket;
  protected subscriptions = new Set<AsyncPushIterator<any>>();
  protected explicitlyClosed = false;

  constructor(options: GraphQLWebSocketClientOptions) {
    this.url = options.url;
    this.protocol = options.protocol;
    this.connect =
      options.connect ??
      ((url, protocol, connectionInitPayload?) =>
        new GraphQLClientWebSocket({
          socket: new WebSocket(url, protocol),
          connectionInitPayload,
        }));
  }

  subscribe<TExecutionResult>(
    payload: SubscribePayload,
    options?: SubscribeOptions
  ) {
    this.explicitlyClosed = false;

    return new AsyncPushIterator<TExecutionResult>(async (it) => {
      this.subscriptions.add(it);

      const {
        maxRetries = 0,
        minRetryDelay = 500,
        maxRetryDelay = 10000,
        delayMultiplier: exponentialBackoffMultiplier = 2,
      } = options ?? {};

      let retryTimeoutId: NodeJS.Timeout;

      const run = async (retries: number, retryDelay: number) => {
        try {
          const socket = await this.maybeConnect();
          const results = await socket.subscribe<TExecutionResult>(payload);

          for await (const result of results) {
            it.push(result);
          }

          it.finish();
        } catch (err) {
          if (!this.explicitlyClosed && retries > 0 && this.shouldRetry(err)) {
            const nextRetryDelay = Math.floor(
              Math.min(
                exponentialBackoffMultiplier * retryDelay,
                maxRetryDelay
              ) +
                Math.random() * minRetryDelay
            );

            retryTimeoutId = setTimeout(
              () => run(retries - 1, nextRetryDelay),
              retryDelay
            );
          } else {
            it.throw(err);
          }
        }
      };

      run(maxRetries, minRetryDelay);

      return () => {
        clearTimeout(retryTimeoutId);
        this.subscriptions.delete(it);
      };
    });
  }

  close(code?: number, reason?: string) {
    this.socket?.close(code ?? 1000, reason ?? "Normal Closure");
    this.explicitlyClosed = true;
  }

  shouldRetry(err: Error & { code?: number }) {
    if (typeof err.code !== "number") return false;

    switch (err.code) {
      case 1002:
      case 1011:
      case 4400:
      case 4401:
      case 4409:
      case 4429:
        return false;
    }

    return false;
  }

  async maybeConnect() {
    // TODO isOpen is bad here
    if (!this.socket || !this.socket.isOpen()) {
      this.socket = this.connect(
        this.url,
        this.protocol,
        this.connectionInitPayload
      );
    }

    this.connectionAckPayload = await this.socket.requireAck();

    return this.socket;
  }
}
