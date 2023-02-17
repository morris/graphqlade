import {
  execute,
  ExecutionResult,
  getOperationAST,
  GraphQLError,
  GraphQLSchema,
  validate,
} from "graphql";
import { IncomingHttpHeaders } from "http";
import {
  CreateContextFn,
  GraphQLExecutionArgsParser,
  ParsedExecutionArgs,
} from "../server";
import { assertRecord, toError } from "../util";
import {
  ExpressNextFunctionLike,
  ExpressRequestLike,
  ExpressResponseLike,
} from "./express";
import { KoaContextLike, KoaNextFunctionLike } from "./koa";

export interface GraphQLHttpServerOptions<TContext> {
  /**
   * Executable GraphQLSchema instance.
   */
  schema: GraphQLSchema;

  /**
   * Function to create context from HTTP headers.
   */
  createContext: CreateContextFn<TContext>;

  /**
   * Overrides execution args parser.
   */
  parser?: GraphQLExecutionArgsParser;
}

export interface GraphQLHttpServerRequest {
  method: string;
  headers: IncomingHttpHeaders;
  query?: ParsedQs;
  body?: unknown;
}

export interface ParsedQs {
  [key: string]: string | string[] | ParsedQs | ParsedQs[] | undefined;
}

export interface GraphQLHttpServerResponse {
  status: number;
  headers: Record<string, string>;
  body: ExecutionResult;
}

export class GraphQLHttpServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly createContext: CreateContextFn<TContext>;
  public readonly parser: GraphQLExecutionArgsParser;

  constructor(options: GraphQLHttpServerOptions<TContext>) {
    this.schema = options.schema;
    this.createContext = options.createContext;
    this.parser = options.parser ?? new GraphQLExecutionArgsParser();
  }

  // express helpers

  expressHandler() {
    return (
      req: ExpressRequestLike,
      res: ExpressResponseLike,
      next: ExpressNextFunctionLike
    ) => this.handleExpress(req, res, next);
  }

  async handleExpress(
    req: ExpressRequestLike,
    res: ExpressResponseLike,
    next: ExpressNextFunctionLike
  ) {
    try {
      const response = await this.execute(req);

      res.status(response.status).set(response.headers).json(response.body);
    } catch (err) {
      next(toError(err));
    }
  }

  // koa helpers

  koaHandler() {
    return (ctx: KoaContextLike, next: KoaNextFunctionLike) =>
      this.handleKoa(ctx, next);
  }

  async handleKoa(ctx: KoaContextLike, next: KoaNextFunctionLike) {
    const response = await this.execute(ctx.request);

    ctx.status = response.status;
    ctx.set(response.headers);
    ctx.body = response.body;
    await next();
  }

  // execution

  async execute(
    request: GraphQLHttpServerRequest,
    contextValue?: TContext
  ): Promise<GraphQLHttpServerResponse> {
    try {
      return this.executeParsed(
        request,
        this.parse(request),
        contextValue ?? this.createContext(request)
      );
    } catch (err_) {
      const err = toError(err_);

      let status = 500;

      if (err instanceof TypeError && err.message.match(/^Invalid/)) {
        status = 400;
      }

      if (typeof err.status === "number") {
        status = err.status;
      }

      return {
        status,
        headers: {},
        body: {
          errors: [this.serializeError(err_)],
        },
      };
    }
  }

  async executeParsed(
    request: GraphQLHttpServerRequest,
    args: ParsedExecutionArgs,
    contextValue?: TContext
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

    return this.executeValidated(
      request,
      args,
      contextValue ?? this.createContext(request)
    );
  }

  async executeValidated(
    request: GraphQLHttpServerRequest,
    args: ParsedExecutionArgs,
    contextValue?: TContext
  ) {
    const body = await execute({
      schema: this.schema,
      contextValue: contextValue ?? this.createContext(request),
      ...args,
    });

    return {
      status: 200,
      headers: {},
      body,
    };
  }

  // validation

  async validate(request: GraphQLHttpServerRequest, args: ParsedExecutionArgs) {
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

  parse(request: GraphQLHttpServerRequest): ParsedExecutionArgs {
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
        } catch (err_) {
          const err = toError(err_);
          err.status = 405;

          throw err;
        }
    }
  }

  parseGet(request: GraphQLHttpServerRequest): ParsedExecutionArgs {
    return this.parser.parse({
      query: request.query?.query,
      operationName: request.query?.operationName,
      variables: request.query?.variables,
    });
  }

  parsePost(request: GraphQLHttpServerRequest): ParsedExecutionArgs {
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
