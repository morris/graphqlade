import { GraphQLFieldResolver, GraphQLSchema, isSchema } from "graphql";
import { join } from "path";
import { GraphQLReader } from "../read";
import {
  GraphQLSchemaManager,
  SubscriptionResolver,
  ResolverMap,
  ResolverErrorHandler,
} from "./GraphQLSchemaManager";

export interface BuildExecutableSchemaOptions<TContext> {
  root?: string;
  schema?: string | GraphQLSchema;
  resolvers: ResolverMap<TContext> | { __isGeneratedResolverMap?: TContext };
  subscriptionResolver?:
    | SubscriptionResolver<TContext>
    | { __isGeneratedSubscriptionResolver?: TContext };
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

  schemaManager.addResolversToSchema(
    options.resolvers as ResolverMap<TContext>
  );

  schemaManager.addInheritedResolversToSchema(
    options.resolvers as ResolverMap<TContext>
  );

  if (options.subscriptionResolver) {
    schemaManager.addSubscriptionResolverToSchema(
      options.subscriptionResolver as SubscriptionResolver<TContext>
    );
  }

  if (options.defaultFieldResolver) {
    schemaManager.addDefaultFieldResolverToSchema(options.defaultFieldResolver);
  }

  if (options.resolverErrorHandler) {
    schemaManager.setResolverErrorHandler(options.resolverErrorHandler);
  }

  return schema;
}
