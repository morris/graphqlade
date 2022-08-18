import { GraphQLFieldResolver, GraphQLSchema, isSchema } from "graphql";
import { IncomingHttpHeaders } from "http";
import { join } from "path";
import { GraphQLHttpServer, GraphQLHttpServerOptions } from "../http";
import { GraphQLReader } from "../read";
import { GraphQLWebSocketServer, GraphQLWebSocketServerOptions } from "../ws";
import {
  GraphQLSchemaManager,
  ResolverErrorHandler,
  ResolversInput,
} from "./GraphQLSchemaManager";

export type GraphQLServerOptions<TContext> =
  GraphQLHttpServerOptions<TContext> &
    GraphQLWebSocketServerOptions<TContext> & {
      http?: GraphQLHttpServer<TContext>;
      ws?: GraphQLWebSocketServer<TContext>;
    };

export interface GraphQLServerBootstrapOptions<TContext>
  extends Omit<GraphQLServerOptions<TContext>, "schema"> {
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
  useStitchingDirectives?: boolean;
}

export interface CreateContextFnOptions {
  headers?: IncomingHttpHeaders;
  connectionInitPayload?: Record<string, unknown> | null;
}

export type CreateContextFn<TContext> = (
  options: CreateContextFnOptions
) => TContext;

export class GraphQLServer<TContext> extends GraphQLSchemaManager<TContext> {
  public readonly http: GraphQLHttpServer<TContext>;
  public readonly ws: GraphQLWebSocketServer<TContext>;

  constructor(options: GraphQLServerOptions<TContext>) {
    super(options.schema);
    this.http = options.http ?? new GraphQLHttpServer(options);
    this.ws = options.ws ?? new GraphQLWebSocketServer(options);
  }

  static async bootstrap<TContext>(
    options: GraphQLServerBootstrapOptions<TContext>
  ) {
    const reader =
      options.reader ?? new GraphQLReader({ disableCaching: true });
    const root = options.root ?? "";
    const schema = isSchema(options.schema)
      ? options.schema
      : await reader.buildSchemaFromDir(join(root, options.schema ?? "schema"));

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

    if (options.useStitchingDirectives) {
      server.setStitchingSdlResolver();
    }

    return server;
  }
}
