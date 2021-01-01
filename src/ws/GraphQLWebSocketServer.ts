import { GraphQLError, GraphQLSchema, subscribe, validate } from "graphql";
import type { IncomingMessage } from "http";
import type WebSocket from "ws";
import {
  GraphQLExecutionArgsParser,
  ParsedExecutionArgs,
  RawExecutionArgs,
} from "../server/GraphQLExecutionArgsParser";
import {
  GraphQLServerWebSocket,
  AcknowledgeFn,
} from "./GraphQLServerWebSocket";

export interface GraphQLWebSocketServerOptions {
  schema: GraphQLSchema;
  executionArgsParser?: GraphQLExecutionArgsParser;
  connectionInitWaitTimeout?: number;
  acknowledge?: AcknowledgeFn;
}

export class GraphQLWebSocketServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly executionArgsParser: GraphQLExecutionArgsParser;
  protected connectionInitWaitTimeout: number;
  protected acknowledge: AcknowledgeFn;

  constructor(options: GraphQLWebSocketServerOptions) {
    this.schema = options.schema;
    this.executionArgsParser =
      options.executionArgsParser ?? new GraphQLExecutionArgsParser();
    this.connectionInitWaitTimeout = options.connectionInitWaitTimeout ?? 3000;
    this.acknowledge = options.acknowledge ?? (() => null);
  }

  handleConnection(
    socket: WebSocket,
    req: IncomingMessage,
    contextValue: TContext
  ) {
    return new GraphQLServerWebSocket({
      socket,
      req,
      subscribe: (args) => this.subscribe(args, contextValue),
      connectionInitWaitTimeout: this.connectionInitWaitTimeout,
      acknowledge: this.acknowledge,
    });
  }

  async subscribe(args: RawExecutionArgs, contextValue: TContext) {
    try {
      return await this.subscribeParsed(this.parse(args), contextValue);
    } catch (err) {
      return {
        errors: [this.serializeError(err)],
      };
    }
  }

  async subscribeParsed(args: ParsedExecutionArgs, contextValue: TContext) {
    const errors = await this.validate(args);

    if (errors.length > 0) {
      return {
        errors,
      };
    }

    return this.subscribeValidated(args, contextValue);
  }

  async subscribeValidated(args: ParsedExecutionArgs, contextValue: TContext) {
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
