import { GraphQLError, GraphQLSchema, subscribe, validate } from "graphql";
import type { IncomingMessage } from "http";
import type WebSocket from "ws";
import {
  CreateContextFn,
  GraphQLExecutionArgsParser,
  ParsedExecutionArgs,
  RawExecutionArgs,
} from "../server";
import {
  AcknowledgeFn,
  GraphQLServerWebSocket,
} from "./GraphQLServerWebSocket";

export interface GraphQLWebSocketServerOptions<TContext> {
  /**
   * Executable GraphQLSchema instance.
   */
  schema: GraphQLSchema;

  /**
   * Timeout until receiving initialization message, in milliseconds.
   * Defaults to 3000.
   */
  connectionInitWaitTimeout?: number;

  /**
   * Acknowledgement function.
   * Called once per connection with the initialization message payload.
   * May throw an error to cause socket closure (4401 Unauthorized).
   */
  acknowledge?: AcknowledgeFn;

  /**
   * Context factory function.
   * Called once per subscription with the original initialization payload.
   * The returned context is used for execution during the lifetime
   * of the subscription.
   */
  createContext: CreateContextFn<TContext>;

  /**
   * Overrides execution args parser.
   */
  executionArgsParser?: GraphQLExecutionArgsParser;
}

export class GraphQLWebSocketServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly executionArgsParser: GraphQLExecutionArgsParser;
  public readonly graphqlSockets = new Set<GraphQLServerWebSocket>();
  protected connectionInitWaitTimeout: number;
  protected acknowledge: AcknowledgeFn;
  protected createContext: CreateContextFn<TContext>;

  constructor(options: GraphQLWebSocketServerOptions<TContext>) {
    this.schema = options.schema;
    this.executionArgsParser =
      options.executionArgsParser ?? new GraphQLExecutionArgsParser();
    this.connectionInitWaitTimeout = options.connectionInitWaitTimeout ?? 3000;
    this.acknowledge = options.acknowledge ?? (() => null);
    this.createContext = options.createContext;
  }

  connectionHandler() {
    return (socket: WebSocket, req: IncomingMessage) =>
      this.handleConnection(socket, req);
  }

  handleConnection(socket: WebSocket, req: IncomingMessage) {
    const graphqlSocket = new GraphQLServerWebSocket({
      socket,
      req,
      subscribe: (args, connectionInitPayload) =>
        this.subscribe(args, connectionInitPayload),
      connectionInitWaitTimeout: this.connectionInitWaitTimeout,
      acknowledge: this.acknowledge,
    });

    this.graphqlSockets.add(graphqlSocket);

    graphqlSocket.socket.on("close", () =>
      this.graphqlSockets.delete(graphqlSocket)
    );
    graphqlSocket.socket.on("error", () =>
      this.graphqlSockets.delete(graphqlSocket)
    );

    return graphqlSocket;
  }

  close(code?: number, reason?: string) {
    for (const graphqlSocket of this.graphqlSockets) {
      graphqlSocket.close(code ?? 1000, reason ?? "Normal Closure");
    }

    this.graphqlSockets.clear();
  }

  async subscribe(
    args: RawExecutionArgs,
    connectionInitPayload?: Record<string, unknown> | null
  ) {
    try {
      return await this.subscribeParsed(
        this.parse(args),
        connectionInitPayload
      );
    } catch (err) {
      return {
        errors: [this.serializeError(err)],
      };
    }
  }

  async subscribeParsed(
    args: ParsedExecutionArgs,
    connectionInitPayload?: Record<string, unknown> | null
  ) {
    const contextValue = this.createContext({ connectionInitPayload, ...args });
    const errors = await this.validate(args);

    if (errors.length > 0) {
      return {
        errors,
      };
    }

    return this.subscribeValidated(args, connectionInitPayload, contextValue);
  }

  async subscribeValidated(
    args: ParsedExecutionArgs,
    connectionInitPayload: Record<string, unknown> | undefined | null,
    contextValue: TContext
  ) {
    return subscribe({
      schema: this.schema,
      contextValue,
      ...args,
    });
  }

  // validation

  async validate(args: ParsedExecutionArgs) {
    return validate(this.schema, args.document) as GraphQLError[];
  }

  // parse

  parse(request: RawExecutionArgs) {
    return this.executionArgsParser.parse(request);
  }

  // util

  serializeError(err: unknown): GraphQLError {
    if (err instanceof GraphQLError) {
      return err;
    } else {
      return {
        message:
          (err as { message?: string })?.message ?? "Internal Server Error",
      } as GraphQLError;
    }
  }
}
