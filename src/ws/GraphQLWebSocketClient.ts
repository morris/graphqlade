// keep granular imports here for browser build
import type { ExecutionResult } from 'graphql';
import { AsyncPushIterator } from '../util/AsyncPushIterator';
import { GraphQLResultError } from '../util/GraphQLResultError';
import { toError } from '../util/toError';
import {
  GraphQLClientWebSocket,
  SubscribePayload,
  WebSocketLike,
} from './GraphQLClientWebSocket';

export interface GraphQLWebSocketClientOptions<
  TTypings extends
    GraphQLWebSocketClientTypings = GraphQLWebSocketClientTypings,
> {
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
   * Overrides web socket creation.
   * For example, when using GraphQLWebSocketClient on server-side, you'll need
   * to create a WebSocket from "ws" instead of a standard WebSocket.
   */
  createWebSocket?: CreateWebSocketFn;

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

  typings?: TTypings;
}

export interface GraphQLWebSocketClientTypings {
  SubscriptionName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OperationNameToVariables: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OperationNameToData: any;
  OperationNameToDocument: Record<string, string>;
}

export type CreateWebSocketFn = (
  url: string,
  protocol: string,
) => WebSocketLike;

export class GraphQLWebSocketClient<
  TTypings extends
    GraphQLWebSocketClientTypings = GraphQLWebSocketClientTypings,
> {
  public readonly url: string;
  public readonly protocol: string;
  public graphqlSocket?: GraphQLClientWebSocket;
  protected createWebSocket: CreateWebSocketFn;
  protected connectionInitPayload?: Record<string, unknown>;
  protected connectionAckTimeout: number;
  protected connectionAckPayload?: Record<string, unknown>;
  protected autoReconnect: boolean;
  protected minReconnectDelay: number;
  protected maxReconnectDelay: number;
  protected reconnectDelayMultiplier: number;
  protected reconnectDelay: number;
  protected reconnectDelayPromise?: Promise<void>;
  protected operations: TTypings['OperationNameToDocument'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected subscriptions = new Set<AsyncPushIterator<any>>();

  constructor(options: GraphQLWebSocketClientOptions<TTypings>) {
    this.url = options.url
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
    this.protocol = options.protocol ?? 'graphql-transport-ws';
    this.connectionInitPayload = options.connectionInitPayload;
    this.connectionAckTimeout = options.connectionAckTimeout ?? 3000;

    this.createWebSocket =
      options.createWebSocket ??
      ((url, protocol) => new WebSocket(url, protocol));

    this.autoReconnect = options.autoReconnect !== false;
    this.minReconnectDelay = Math.max(options.minReconnectDelay ?? 500, 10);
    this.maxReconnectDelay = options.maxReconnectDelay ?? 30000;
    this.reconnectDelayMultiplier = options.reconnectDelayMultiplier ?? 2;
    this.reconnectDelay = 0;

    this.operations = options.typings?.OperationNameToDocument ?? {};
  }

  setConnectionInitPayload(connectionInitPayload: Record<string, unknown>) {
    this.connectionInitPayload = connectionInitPayload;
  }

  subscribeAsyncNamed<TSubscriptionName extends TTypings['SubscriptionName']>(
    operationName: TSubscriptionName,
    variables: TTypings['OperationNameToVariables'][TSubscriptionName],
    options: {
      onData: (
        data: TTypings['OperationNameToData'][TSubscriptionName],
      ) => unknown;
      onError: (error: Error) => unknown;
    },
  ) {
    return this.subscribeAsync(
      {
        operationName,
        query: this.operations[operationName],
        variables,
      },
      options,
    );
  }

  subscribeAsync<TData>(
    payload: SubscribePayload,
    options: {
      onData: (data: TData) => unknown;
      onError: (error: Error) => unknown;
    },
  ) {
    const iterator = this.subscribe<TData>(payload);

    const timeout = setTimeout(async () => {
      try {
        for await (const result of iterator) {
          const errors = result.errors ?? [];

          if (errors.length > 0) {
            options.onError(new GraphQLResultError(result));
          } else if (result.data) {
            options.onData(result.data);
          }
        }
      } catch (err) {
        options.onError(toError(err));
      }
    }, 1);

    return () => {
      clearTimeout(timeout);
      iterator.return();
    };
  }

  subscribeNamed<TSubscriptionName extends TTypings['SubscriptionName']>(
    operationName: TSubscriptionName,
    variables: TTypings['OperationNameToVariables'][TSubscriptionName],
  ) {
    return this.subscribe<TTypings['OperationNameToData'][TSubscriptionName]>({
      operationName,
      query: this.operations[operationName],
      variables,
    });
  }

  subscribe<TData>(payload: SubscribePayload) {
    return new AsyncPushIterator<ExecutionResult<TData>>(async (it) => {
      this.subscriptions.add(it);
      let innerIt: AsyncPushIterator<ExecutionResult<TData>> | undefined;

      const run = async () => {
        try {
          const socket = await this.requireConnection();
          innerIt = socket.subscribe<TData>(payload);

          for await (const result of innerIt) {
            it.push(result);
          }

          it.finish();
        } catch (err) {
          if (this.shouldRetry(toError(err))) {
            setTimeout(run, 1);
          } else {
            it.throw(err);
          }
        } finally {
          innerIt?.return();
        }
      };

      run();

      return () => {
        innerIt?.return();
        this.subscriptions.delete(it);
      };
    });
  }

  close(code?: number, reason?: string) {
    for (const subscription of this.subscriptions) {
      subscription.finish();
    }

    this.graphqlSocket?.close(code ?? 1000, reason ?? 'Normal Closure');
  }

  shouldRetry(err: Error & { code?: number }) {
    switch (err.code) {
      case 1000:
      case 1005:
      case 1006:
      case 1012:
      case 1013:
      case 1014:
      case -1:
        return true;
      default:
        return false;
    }
  }

  async requireConnection() {
    await this.awaitReconnectDelay();

    if (!this.graphqlSocket || !this.graphqlSocket.isOpenOrConnecting()) {
      this.graphqlSocket = new GraphQLClientWebSocket({
        socket: this.createWebSocket(this.url, this.protocol),
        connectionAckTimeout: this.connectionAckTimeout,
      }).init(this.connectionInitPayload);
    }

    try {
      this.connectionAckPayload = await this.graphqlSocket.requireAck();
      this.resetReconnectDelay();

      return this.graphqlSocket;
    } catch (err) {
      this.increaseReconnectDelay();

      throw err;
    }
  }

  protected async awaitReconnectDelay() {
    if (this.graphqlSocket?.isOpenOrConnecting()) return;
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
        this.maxReconnectDelay,
      ) +
        Math.random() * this.minReconnectDelay,
    );
  }
}
