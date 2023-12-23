import {
  buildSchema,
  GraphQLFieldResolver,
  GraphQLSchema,
  isSchema,
} from 'graphql';
import { IncomingHttpHeaders } from 'http';
import { join } from 'path';
import { GraphQLHttpServer, GraphQLHttpServerOptions } from '../http';
import { GraphQLReader } from '../read';
import { GraphQLWebSocketServer, GraphQLWebSocketServerOptions } from '../ws';
import {
  GraphQLExecutionArgsParser,
  GraphQLExecutionArgsParserOptions,
  ParsedExecutionArgs,
} from './GraphQLExecutionArgsParser';
import {
  GraphQLSchemaManager,
  ResolverErrorHandler,
  ResolversInput,
} from './GraphQLSchemaManager';

export type GraphQLServerOptions<TContext> =
  GraphQLHttpServerOptions<TContext> &
    GraphQLWebSocketServerOptions<TContext> & {
      http?: GraphQLHttpServer<TContext>;
      ws?: GraphQLWebSocketServer<TContext>;

      /**
       * Execution args parser options.
       */
      parserOptions?: GraphQLExecutionArgsParserOptions;
    };

export interface GraphQLServerBootstrapOptions<TContext>
  extends Omit<GraphQLServerOptions<TContext>, 'schema'> {
  /**
   * Path to root directory for code generation.
   * It's recommended to use a root relative to __dirname.
   * Defaults to the current working dir.
   */
  root?: string;

  /**
   * Path to directory of GraphQL schema documents, relative to root,
   * OR a GraphQLSchema instance.
   * Defaults to "schema".
   */
  schema?: string | GraphQLSchema;

  /**
   * GraphQLReader instance.
   */
  reader?: GraphQLReader;

  /**
   * Default field resolver.
   */
  defaultFieldResolver?: GraphQLFieldResolver<unknown, TContext>;

  /**
   * Resolver definitions, or list of resolver definitions.
   */
  resolvers?: ResolversInput<TContext>;

  /**
   * Resolver error handler.
   */
  resolverErrorHandler?: ResolverErrorHandler<TContext>;

  /*
   * Adds a query resolver for the _sdl query required
   * to use stitching directives with a stitching service.
   * Best used together with the same flag on gql2ts
   */
  stitching?: boolean;
}

export interface CreateContextFnOptions extends ParsedExecutionArgs {
  headers?: IncomingHttpHeaders;
  connectionInitPayload?: Record<string, unknown> | null;
}

export type CreateContextFn<TContext> = (
  options: CreateContextFnOptions,
) => TContext | Promise<TContext>;

export class GraphQLServer<TContext> extends GraphQLSchemaManager<TContext> {
  public readonly http: GraphQLHttpServer<TContext>;
  public readonly ws: GraphQLWebSocketServer<TContext>;

  constructor(options: GraphQLServerOptions<TContext>) {
    super(options.schema);
    const parser =
      options.parser ?? new GraphQLExecutionArgsParser(options.parserOptions);
    this.http = options.http ?? new GraphQLHttpServer({ ...options, parser });
    this.ws = options.ws ?? new GraphQLWebSocketServer({ ...options, parser });
  }

  static async bootstrap<TContext>(
    options: GraphQLServerBootstrapOptions<TContext>,
  ) {
    const reader =
      options.reader ?? new GraphQLReader({ disableCaching: true });
    const root = options.root ?? '';

    let sdl: string | undefined;
    let schema: GraphQLSchema;

    if (isSchema(options.schema)) {
      schema = options.schema;
    } else {
      sdl = await reader.readDir(join(root, options.schema ?? 'schema'));
      schema = buildSchema(sdl);
    }

    const server = new GraphQLServer({ ...options, schema });

    if (options.defaultFieldResolver) {
      server.setDefaultFieldResolver(options.defaultFieldResolver);
    }

    if (options.resolvers) {
      server.setResolvers(options.resolvers);
    }

    if (options.resolverErrorHandler) {
      server.setResolverErrorHandler(options.resolverErrorHandler);
    }

    if (options.stitching && sdl) {
      server.setSdlResolvers(sdl);
    }

    return server;
  }
}
