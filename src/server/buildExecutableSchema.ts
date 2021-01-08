import { GraphQLFieldResolver, GraphQLSchema, isSchema } from "graphql";
import { join } from "path";
import { GraphQLReader } from "../read";
import {
  GraphQLSchemaManager,
  SubscriptionResolver,
  AnyResolverMap,
  ResolverErrorHandler,
} from "./GraphQLSchemaManager";

export interface BuildExecutableSchemaOptions<TContext> {
  root?: string;
  schema?: string | GraphQLSchema;
  resolvers: AnyResolverMap<TContext>;
  subscriptionResolver?: SubscriptionResolver<TContext>;
  defaultFieldResolver?: GraphQLFieldResolver<unknown, TContext>;
  resolverErrorHandler?: ResolverErrorHandler<TContext>;
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
