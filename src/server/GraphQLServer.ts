import {
  DocumentNode,
  execute,
  ExecutionArgs,
  ExecutionResult,
  getOperationAST,
  GraphQLError,
  GraphQLSchema,
  parse,
  validate,
} from "graphql";
import { cleanOperations } from "../util/cleanOperations";

export interface GraphQLServerOptions {
  schema: GraphQLSchema;
  parseQueryCacheSize?: number;
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

export type IncomingExecutionArgs = Omit<
  ExecutionArgs,
  "schema" | "contextValue"
>;

export interface ParseQueryCacheEntry {
  document: DocumentNode;
  index: number;
}

export class GraphQLServer<TContext> {
  protected schema: GraphQLSchema;
  protected parseQueryCache = new Map<string, ParseQueryCacheEntry>();
  protected parseQueryCacheSize: number;
  protected parseQueryCacheIndex = 0;

  constructor(options: GraphQLServerOptions) {
    this.schema = options.schema;
    this.parseQueryCacheSize = options.parseQueryCacheSize ?? 50;
  }

  // classification

  isNonGraphQLRequest(request: GraphQLServerRequest) {
    const accept = Array.isArray(request.headers.accept)
      ? request.headers.accept
      : [request.headers.accept ?? ""];

    return !!accept.find((it) => it.match(/text\/html/));
  }

  // execution

  async execute(
    request: GraphQLServerRequest,
    contextValue: TContext
  ): Promise<GraphQLServerResponse> {
    try {
      return this.executeParsed(request, this.parse(request), contextValue);
    } catch (err) {
      return {
        status: err.status ?? 500,
        headers: {},
        body: {
          errors: [this.serializeError(err)],
        },
      };
    }
  }

  async executeParsed(
    request: GraphQLServerRequest,
    args: IncomingExecutionArgs,
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
    args: IncomingExecutionArgs,
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

  async validate(request: GraphQLServerRequest, args: IncomingExecutionArgs) {
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

  parse(request: GraphQLServerRequest): IncomingExecutionArgs {
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
          err.status = 405;

          throw err;
        }
    }
  }

  parseGet(request: GraphQLServerRequest): IncomingExecutionArgs {
    return {
      document: this.parseQuery(request.query?.query),
      operationName: this.parseOperationName(request.query?.operationName),
      variableValues: this.parseVariables(request.query?.variables),
    };
  }

  parsePost(request: GraphQLServerRequest): IncomingExecutionArgs {
    const body = this.parseBody(request.body);

    return {
      document: this.parseQuery(body.query),
      operationName: this.parseOperationName(body.operationName),
      variableValues: this.parseVariables(body.variables),
    };
  }

  parseQuery(query: unknown) {
    if (typeof query !== "string") {
      throw new Error("Invalid query, expected string");
    }

    const cached = this.parseQueryCache.get(query);

    if (cached) {
      cached.index = this.parseQueryCacheIndex++;

      return cached.document;
    }

    const document = cleanOperations(parse(query));

    this.parseQueryCache.set(query, {
      document,
      index: this.parseQueryCacheIndex++,
    });

    if (this.parseQueryCache.size > this.parseQueryCacheSize) {
      const minIndex = this.parseQueryCacheIndex - this.parseQueryCacheSize;

      for (const [key, entry] of this.parseQueryCache) {
        if (entry.index < minIndex) this.parseQueryCache.delete(key);
      }
    }

    return document;
  }

  parseOperationName(operationName: unknown): string | undefined {
    if (
      operationName === "" ||
      operationName === null ||
      typeof operationName === "undefined"
    ) {
      return undefined;
    }

    if (typeof operationName !== "string") {
      throw new Error("Invalid operationName, expected string");
    }

    return operationName;
  }

  parseVariables(variables: unknown): Record<string, unknown> | undefined {
    if (
      variables === "" ||
      variables === null ||
      typeof variables === "undefined" ||
      variables === "null"
    ) {
      return undefined;
    }

    let parsed = variables;

    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (err) {
        throw new Error(
          `Invalid variables, failed to parse JSON: ${err.message}`
        );
      }
    }

    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid variables, expected object");
    }

    return parsed as Record<string, unknown>;
  }

  parseBody(body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Invalid body, expected object");
    }

    return body as Record<string, unknown>;
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
