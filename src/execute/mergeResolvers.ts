import { GraphQLScalarType } from "graphql";
import { AnyResolverMap } from "./GraphQLSchemaManager";

export function mergeResolvers<TContext>(
  resolversList: AnyResolverMap<TContext>[]
): AnyResolverMap<TContext> {
  return (resolversList as Record<string, Record<string, unknown>>[]).reduce(
    (mergedResolvers, resolvers) => {
      for (const [typeName, resolver] of Object.entries(resolvers)) {
        if (resolver instanceof GraphQLScalarType) {
          mergedResolvers[typeName] = resolver;
        } else {
          mergedResolvers[typeName] = {
            ...mergedResolvers[typeName],
            ...resolver,
          };
        }
      }

      return mergedResolvers;
    },
    {}
  );
}
