import { GraphQLSchema } from "graphql";
import { IncomingHttpHeaders } from "http";
import { GraphQLHttpServer, GraphQLHttpServerOptions } from "../http";
import { GraphQLWebSocketServer, GraphQLWebSocketServerOptions } from "../ws";

export interface CreateContextFnOptions {
  headers?: IncomingHttpHeaders;
  connectionInitPayload?: Record<string, unknown> | null;
}

export type CreateContextFn<TContext> = (
  options: CreateContextFnOptions
) => TContext;

export type GraphQLServerOptions<TContext> =
  GraphQLHttpServerOptions<TContext> &
    GraphQLWebSocketServerOptions<TContext> & {
      http?: GraphQLHttpServer<TContext>;
      ws?: GraphQLWebSocketServer<TContext>;
    };

export class GraphQLServer<TContext> {
  public readonly schema: GraphQLSchema;
  public readonly http: GraphQLHttpServer<TContext>;
  public readonly ws: GraphQLWebSocketServer<TContext>;

  constructor(options: GraphQLServerOptions<TContext>) {
    this.schema = options.schema;
    this.http = options.http ?? new GraphQLHttpServer(options);
    this.ws = options.ws ?? new GraphQLWebSocketServer(options);
  }
}
