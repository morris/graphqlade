import { GraphQLScalarType } from 'graphql';
import {
  AnyResolvers,
  CustomResolvers,
  ResolversInput,
  TypeResolver,
} from '../server';

export function mergeResolvers<TContext>(
  resolversInput: ResolversInput<TContext>,
): AnyResolvers<TContext> {
  if (!Array.isArray(resolversInput)) return resolversInput;

  return (resolversInput as CustomResolvers<TContext>[]).reduce(
    (mergedResolvers, resolvers) => {
      for (const [typeName, resolver] of Object.entries(resolvers)) {
        if (resolver instanceof GraphQLScalarType) {
          mergedResolvers[typeName] = resolver;
        } else {
          mergedResolvers[typeName] = {
            ...mergedResolvers[typeName],
            ...resolver,
          } as TypeResolver;
        }
      }

      return mergedResolvers;
    },
    {},
  );
}
