import { GraphQLFieldResolver, GraphQLSchema, isSchema } from "graphql";
import { join } from "path";
import { GraphQLReader } from "../read/GraphQLReader";
import {
  AnyResolverMap,
  GraphQLSchemaManager,
  ResolverErrorHandler,
  SubscriptionResolver,
} from "./GraphQLSchemaManager";

export interface BuildExecutableSchemaOptions<TContext> {
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
   * Map of resolvers.
   */
  resolvers: AnyResolverMap<TContext>;

  /**
   * Subscription resolver.
   */
  subscriptionResolver?: SubscriptionResolver<TContext>;

  /**
   * Default field resolver.
   */
  defaultFieldResolver?: GraphQLFieldResolver<unknown, TContext>;

  /**
   * Error handler to be applied for each resolver.
   * Useful for logging and monitoring.
   * May return a new Error instance to throw.
   * Cannot "prevent" an error.
   */
  resolverErrorHandler?: ResolverErrorHandler<TContext>;

  /**
   * GraphQLReader instance.
   */
  reader?: GraphQLReader;
}

export async function buildExecutableSchema<TContext>(
  options: BuildExecutableSchemaOptions<TContext>
) {
  const reader = options.reader ?? new GraphQLReader({ disableCaching: true });
  const root = options.root ?? "";
  const schema = isSchema(options.schema)
    ? options.schema
    : await reader.buildSchemaFromDir(join(root, options.schema ?? "schema"));
  const schemaManager = new GraphQLSchemaManager<TContext>(schema);

  schemaManager.addResolversToSchema(options.resolvers);
  schemaManager.addInheritedResolversToSchema(options.resolvers);

  if (options.subscriptionResolver) {
    schemaManager.addSubscriptionResolverToSchema(options.subscriptionResolver);
  }

  if (options.defaultFieldResolver) {
    schemaManager.addDefaultFieldResolverToSchema(options.defaultFieldResolver);
  }

  if (options.resolverErrorHandler) {
    schemaManager.setResolverErrorHandler(options.resolverErrorHandler);
  }

  return schema;
}
