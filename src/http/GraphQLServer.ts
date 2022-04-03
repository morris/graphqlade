import {
  execute,
  ExecutionResult,
  getOperationAST,
  GraphQLError,
  GraphQLSchema,
  validate,
} from "graphql";
import {
  GraphQLExecutionArgsParser,
  ParsedExecutionArgs,
} from "../server/GraphQLExecutionArgsParser";
import { assertRecord } from "../util/assert";
import { toError } from "../util/toError";

export interface GraphQLServerOptions {
  /**
   * Executable GraphQLSchema instance.
   */
  schema: GraphQLSchema;

  /**
   * Overrides execution args parser.
   */
  parser?: GraphQLExecutionArgsParser;
}

export interface GraphQLServerRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  query?: ParsedQs;
  body?: unknown;
}

export interface ParsedQs {
  [key: string]: string | string[] | ParsedQs | ParsedQs[] | undefined;
}

export interface GraphQLServerResponse {
  status: number;
  headers: Record<string, string>;
  body: ExecutionResult;
}

export class GraphQLServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly parser: GraphQLExecutionArgsParser;

  constructor(options: GraphQLServerOptions) {
    this.schema = options.schema;
    this.parser = options.parser ?? new GraphQLExecutionArgsParser();
  }

  // execution

  async execute(
    request: GraphQLServerRequest,
    contextValue: TContext
  ): Promise<GraphQLServerResponse> {
    try {
      return this.executeParsed(request, this.parse(request), contextValue);
    } catch (err) {
      const errWithStatus = toError(err) as Error & { status?: number };
      const status =
        typeof errWithStatus.status === "number" ? errWithStatus.status : 500;

      return {
        status,
        headers: {},
        body: {
          errors: [this.serializeError(err)],
        },
      };
    }
  }

  async executeParsed(
    request: GraphQLServerRequest,
    args: ParsedExecutionArgs,
    contextValue: TContext
  ) {
    const errors = await this.validate(request, args);

    if (errors.length > 0) {
      return {
        status: 400,
        headers: {},
        body: {
          errors,
        },
      };
    }

    return this.executeValidated(request, args, contextValue);
  }

  async executeValidated(
    _: GraphQLServerRequest,
    args: ParsedExecutionArgs,
    contextValue: TContext
  ) {
    const body = await execute({
      schema: this.schema,
      contextValue,
      ...args,
    });

    return {
      status: 200,
      headers: {},
      body,
    };
  }

  // validation

  async validate(request: GraphQLServerRequest, args: ParsedExecutionArgs) {
    const errors = validate(this.schema, args.document) as GraphQLError[];
    const operation = getOperationAST(args.document, args.operationName);

    if (
      operation &&
      operation.operation === "mutation" &&
      request.method === "GET"
    ) {
      errors.push({
        message: "Mutations are not allowed via GET",
      } as GraphQLError);
    }

    return errors;
  }

  // parsing

  parse(request: GraphQLServerRequest): ParsedExecutionArgs {
    switch (request.method) {
      case "GET":
        return this.parseGet(request);
      case "POST":
        return this.parsePost(request);
      default:
        try {
          throw new Error(
            `Unsupported method: ${request.method.toUpperCase()}`
          );
        } catch (err) {
          const errWithStatus = toError(err) as Error & { status?: number };
          errWithStatus.status = 405;

          throw errWithStatus;
        }
    }
  }

  parseGet(request: GraphQLServerRequest): ParsedExecutionArgs {
    return this.parser.parse({
      query: request.query?.query,
      operationName: request.query?.operationName,
      variables: request.query?.variables,
    });
  }

  parsePost(request: GraphQLServerRequest): ParsedExecutionArgs {
    const body = this.parseBody(request.body);

    return this.parser.parse({
      query: body.query,
      operationName: body.operationName,
      variables: body.variables,
    });
  }

  parseBody(body: unknown) {
    assertRecord(body, "Invalid body, expected object");

    return body;
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
