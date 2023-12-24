import {
  execute,
  ExecutionResult,
  getOperationAST,
  GraphQLError,
  GraphQLSchema,
} from 'graphql';
import { IncomingHttpHeaders } from 'http';
import {
  CreateContextFn,
  GraphQLExecutionArgsParser,
  GraphQLExecutionArgsParserOptions,
  ParsedExecutionArgs,
} from '../server';
import { assert, isRecord, toError } from '../util';
import {
  ExpressNextFunctionLike,
  ExpressRequestLike,
  ExpressResponseLike,
} from './express';
import { KoaContextLike, KoaNextFunctionLike } from './koa';

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

  /**
   * Execution args parser options.
   */
  parserOptions?: GraphQLExecutionArgsParserOptions;
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

export interface GraphQLHttpServerResponse<TContext> {
  status: number;
  headers: Record<string, string>;
  body: ExecutionResult;
  context?: TContext;
}

export class GraphQLHttpServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly createContext: CreateContextFn<TContext>;
  public readonly parser: GraphQLExecutionArgsParser;

  constructor(options: GraphQLHttpServerOptions<TContext>) {
    this.schema = options.schema;
    this.createContext = options.createContext;
    this.parser =
      options.parser ?? new GraphQLExecutionArgsParser(options.parserOptions);
  }

  // express helpers

  expressHandler() {
    return (
      req: ExpressRequestLike,
      res: ExpressResponseLike,
      next: ExpressNextFunctionLike,
    ) => this.handleExpress(req, res, next);
  }

  async handleExpress(
    req: ExpressRequestLike,
    res: ExpressResponseLike,
    next: ExpressNextFunctionLike,
  ) {
    try {
      const response = await this.execute({
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
      });

      res.status(response.status).set(response.headers).json(response.body);

      next();
    } catch (err) {
      next(toError(err));
    }
  }

  // koa helpers

  koaHandler() {
    return (ctx: KoaContextLike, next: KoaNextFunctionLike) =>
      this.handleKoa(ctx, next);
  }

  async handleKoa(ctx: KoaContextLike, next?: KoaNextFunctionLike) {
    const response = await this.execute({
      method: ctx.request.method,
      headers: ctx.request.headers,
      body: ctx.request.body,
      query: ctx.request.query,
    });

    ctx.status = response.status;
    ctx.set(response.headers);
    ctx.body = response.body;

    if (next) {
      await next();
    }
  }

  //

  async execute(
    request: GraphQLHttpServerRequest,
  ): Promise<GraphQLHttpServerResponse<TContext>> {
    if (request.method !== 'GET' && request.method !== 'POST') {
      return {
        status: 405,
        headers: {},
        body: {
          errors: [
            this.serializeError({
              message: `Unsupported method: ${request.method.toUpperCase()}`,
            }),
          ],
        },
      };
    }

    let args: ParsedExecutionArgs;

    try {
      args = this.parse(request);
    } catch (err) {
      return {
        status: 400,
        headers: {},
        body: { errors: [this.serializeError(err)] },
      };
    }

    try {
      const errors = this.validate(request, args);

      if (errors.length > 0) {
        return {
          status: 400,
          headers: {},
          body: { errors },
        };
      }

      const context = await this.createContext({ ...request, ...args });

      const body = await execute({
        schema: this.schema,
        contextValue: context,
        ...args,
      });

      return {
        status: 200,
        headers: {},
        body,
        context,
      };
    } catch (err) {
      // This should actually never happen;
      // any errors should be on resolver level at this point
      return {
        status: 500,
        headers: {},
        body: { errors: [this.serializeError(err)] },
      };
    }
  }

  validate(request: GraphQLHttpServerRequest, args: ParsedExecutionArgs) {
    const operation = getOperationAST(args.document, args.operationName);

    if (
      operation &&
      operation.operation === 'mutation' &&
      request.method === 'GET'
    ) {
      return [{ message: 'Mutations are not allowed via GET' } as GraphQLError];
    }

    return this.parser.validate(this.schema, args);
  }

  parse(request: GraphQLHttpServerRequest): ParsedExecutionArgs {
    switch (request.method) {
      case 'GET':
        return this.parseGet(request);
      case 'POST':
        return this.parsePost(request);
      default:
        // Should never happen
        throw new TypeError(
          `Unsupported method: ${request.method.toUpperCase()}`,
        );
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
    assert(isRecord(body), 'Invalid body, expected object');

    return body;
  }

  // util

  serializeError(err: unknown): GraphQLError {
    if (err instanceof GraphQLError) {
      return err;
    } else {
      return {
        message:
          (err as { message?: string })?.message ?? 'Internal Server Error',
      } as GraphQLError;
    }
  }
}
