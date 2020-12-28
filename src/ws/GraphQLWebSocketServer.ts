import { GraphQLError, GraphQLSchema, subscribe, validate } from "graphql";
import {
  GraphQLExecutionArgsParser,
  ParsedExecutionArgs,
  RawExecutionArgs,
} from "../server/GraphQLExecutionArgsParser";

export interface GraphQLWebSocketServerOptions {
  schema: GraphQLSchema;
  parser?: GraphQLExecutionArgsParser;
}

export class GraphQLWebSocketServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly requestParser: GraphQLExecutionArgsParser;

  constructor(options: GraphQLWebSocketServerOptions) {
    this.schema = options.schema;
    this.requestParser = options.parser ?? new GraphQLExecutionArgsParser();
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
    return this.requestParser.parse(request);
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
