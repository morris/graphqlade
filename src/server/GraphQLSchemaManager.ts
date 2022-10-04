import { createHash } from "crypto";
import {
  assertScalarType,
  defaultFieldResolver,
  GraphQLEnumType,
  GraphQLFieldResolver,
  GraphQLInterfaceType,
  GraphQLIsTypeOfFn,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLTypeResolver,
  GraphQLUnionType,
  isEnumType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql";
import { assertDefined, assertRecord, mergeResolvers, toError } from "../util";

export type ResolversInput<TContext> =
  | AnyResolvers<TContext>
  | AnyResolvers<TContext>[];

export type AnyResolvers<TContext> =
  | CustomResolvers<TContext>
  | GeneratedResolvers<TContext>;

export interface GeneratedResolvers<TContext> {
  __isGeneratedResolvers?: TContext;
}

export interface CustomResolvers<TContext> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [typeName: string]: TypeResolver<any, TContext>;
}

// somewhat clashes with GraphQLTypeResolver (which resolves a type's name)
// GraphQLTypeNameResolver would have been a better name on GraphQL.js' side
export type TypeResolver<TSource = unknown, TContext = unknown> =
  | ObjectResolver<TSource, TContext>
  | InterfaceResolver<TSource, TContext>
  | UnionResolver<TSource, TContext>
  | GraphQLEnumType
  | Record<string, string | number>
  | GraphQLScalarType;

export interface ObjectResolver<TSource = unknown, TContext = unknown> {
  [fieldName: string]:
    | GraphQLIsTypeOfFn<TSource, TContext>
    | GraphQLFieldResolver<TSource, TContext>
    | undefined;
  __isTypeOf?: GraphQLIsTypeOfFn<TSource, TContext>;
}

export interface InterfaceResolver<TSource = unknown, TContext = unknown> {
  [fieldName: string]:
    | GraphQLTypeResolver<TSource, TContext>
    | GraphQLFieldResolver<TSource, TContext>
    | undefined;
  __resolveType?: GraphQLTypeResolver<TSource, TContext>;
}

export interface UnionResolver<TSource = unknown, TContext = unknown> {
  __resolveType?: GraphQLTypeResolver<TSource, TContext>;
}

export type ResolverErrorHandler<TContext> = (
  err: Error,
  data: unknown,
  args: unknown,
  context: TContext,
  info: GraphQLResolveInfo
) => Error | undefined | void;

export class GraphQLSchemaManager<TContext> {
  public readonly schema: GraphQLSchema;

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  // default resolvers

  setDefaultFieldResolver(
    defaultFieldResolver: GraphQLFieldResolver<unknown, TContext>
  ) {
    for (const type of Object.values(this.schema.getTypeMap())) {
      if (type.name.startsWith("__")) continue;

      this.setDefaultFieldResolverToType(type, defaultFieldResolver);
    }

    return this;
  }

  protected setDefaultFieldResolverToType(
    type: GraphQLNamedType,
    defaultFieldResolver: GraphQLFieldResolver<unknown, TContext>
  ) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        if (field.name.startsWith("__")) continue;

        if (!field.resolve) field.resolve = defaultFieldResolver;
      }
    }
  }

  protected setSdlResolvers(sdl: string) {
    const sdlVersion = createHash("sha1").update(sdl).digest("hex");

    this.setResolvers({
      Query: {
        _sdl() {
          return sdl;
        },
        _sdlVersion() {
          return sdlVersion;
        },
      },
    });
  }

  // type resolvers

  setResolvers(resolvers: ResolversInput<TContext>) {
    const mergedResolvers = mergeResolvers(resolvers);
    this.setInheritedResolvers(mergedResolvers);
    this.setResolversWithoutInheritance(mergedResolvers);

    return this;
  }

  setResolversWithoutInheritance(resolvers: ResolversInput<TContext>) {
    const mergedResolvers = mergeResolvers(
      resolvers
    ) as CustomResolvers<TContext>;

    for (const typeName of Object.keys(mergedResolvers)) {
      const resolver = mergedResolvers[typeName];
      const type = this.schema.getType(typeName);

      assertDefined(type, `Cannot set resolver for undefined type ${typeName}`);

      this.setResolversToType(type, resolver);
    }

    return this;
  }

  protected setResolversToType(
    type: GraphQLNamedType,
    resolver: TypeResolver<unknown, TContext>
  ) {
    if (isObjectType(type)) {
      this.setResolversToObjectType(
        type,
        resolver as ObjectResolver<unknown, TContext>
      );
    } else if (isInterfaceType(type)) {
      this.setResolversToInterfaceType(
        type,
        resolver as InterfaceResolver<unknown, TContext>
      );
    } else if (isUnionType(type)) {
      this.setResolversToUnionType(
        type,
        resolver as UnionResolver<unknown, TContext>
      );
    } else if (isEnumType(type)) {
      if (!isEnumType(resolver)) assertRecord(resolver);

      this.setResolversToEnumType(type, resolver);
    } else if (isScalarType(type)) {
      this.setResolversToScalarType(type, assertScalarType(resolver));
    } else {
      throw new Error(`Cannot set resolver for ${type.name}`);
    }
  }

  protected setResolversToObjectType(
    type: GraphQLObjectType<unknown, TContext>,
    resolver: ObjectResolver<unknown, TContext>
  ) {
    if (resolver.__isTypeOf) {
      type.isTypeOf = resolver.__isTypeOf;
    }

    this.setFieldResolvers(type, resolver);
  }

  protected setResolversToInterfaceType(
    type: GraphQLInterfaceType,
    resolver: InterfaceResolver<unknown, TContext>
  ) {
    if (resolver.__resolveType) {
      type.resolveType = resolver.__resolveType;
    }

    this.setFieldResolvers(type, resolver);
  }

  protected setFieldResolvers(
    type: GraphQLObjectType<unknown, TContext> | GraphQLInterfaceType,
    resolver:
      | ObjectResolver<unknown, TContext>
      | InterfaceResolver<unknown, TContext>
  ) {
    for (const fieldName of Object.keys(resolver)) {
      if (fieldName.startsWith("__")) continue;

      const fields = type.getFields();
      const field = fields[fieldName];

      assertDefined(
        field,
        `Cannot set field resolver for undefined field ${type.name}.${fieldName}`
      );

      const resolveOrSubscribe =
        type === this.schema.getSubscriptionType() ? "subscribe" : "resolve";

      field[resolveOrSubscribe] = resolver[fieldName] as GraphQLFieldResolver<
        unknown,
        TContext
      >;
    }
  }

  protected setResolversToUnionType(
    type: GraphQLUnionType,
    resolver: UnionResolver<unknown, TContext>
  ) {
    type.resolveType = resolver.__resolveType ?? type.resolveType;
  }

  protected setResolversToEnumType(
    type: GraphQLEnumType,
    resolver: GraphQLEnumType | Record<string, unknown>
  ) {
    let newEnumType: GraphQLEnumType;

    if (isEnumType(resolver)) {
      newEnumType = resolver;
    } else {
      const config = type.toConfig();

      for (const key of Object.keys(resolver)) {
        config.values[key].value = resolver[key] as number | string;
      }

      newEnumType = new GraphQLEnumType(config);
    }

    type.parseLiteral = (...args) => newEnumType.parseLiteral(...args);
    type.parseValue = (...args) => newEnumType.parseValue(...args);
    type.serialize = (...args) => newEnumType.serialize(...args);
  }

  protected setResolversToScalarType(
    type: GraphQLScalarType,
    resolver: GraphQLScalarType
  ) {
    type.parseLiteral = resolver.parseLiteral ?? type.parseLiteral;
    type.parseValue = resolver.parseValue ?? type.parseLiteral;
    type.serialize = resolver.serialize ?? type.serialize;
  }

  // resolver inheritance

  setInheritedResolvers(resolvers: ResolversInput<TContext>) {
    const mergedResolvers = mergeResolvers(
      resolvers
    ) as CustomResolvers<TContext>;

    for (const typeName of Object.keys(mergedResolvers)) {
      const type = this.schema.getType(typeName);

      assertDefined(type, `Cannot set resolver for undefined type ${typeName}`);

      this.setInheritedResolversToType(type, mergedResolvers);
    }

    return this;
  }

  protected setInheritedResolversToType(
    type: GraphQLNamedType,
    resolvers: AnyResolvers<TContext>
  ) {
    if (!isObjectType(type) && !isInterfaceType(type)) return;

    const r = resolvers as CustomResolvers<TContext>;

    for (const implementedInterface of type.getInterfaces()) {
      const resolver = r[implementedInterface.name];

      if (resolver) this.setResolversToType(type, resolver);
    }
  }

  // resolve error handling

  setResolverErrorHandler(handler: ResolverErrorHandler<TContext>) {
    for (const type of Object.values(this.schema.getTypeMap())) {
      if (type.name.startsWith("__")) continue;

      this.setResolverErrorHandlerOnType(type, handler);
    }

    return this;
  }

  protected setResolverErrorHandlerOnType(
    type: GraphQLNamedType,
    handler: ResolverErrorHandler<TContext>
  ) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        const originalResolve = field.resolve ?? defaultFieldResolver;

        // performance: wrapped resolver must not be an "async function"!
        // otherwise, any sync resolvers will be unnecessarily wrapped with an async function
        // and get a performance hit e.g. when instrumented by APM agents
        field.resolve = (data, args, context, info) => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = originalResolve(data, args, context, info);

            if (typeof result?.catch === "function") {
              return result.catch((err: unknown) => {
                const newErr = handler(toError(err), data, args, context, info);

                throw newErr ?? err;
              });
            }

            return result;
          } catch (err) {
            const newErr = handler(toError(err), data, args, context, info);

            throw newErr ?? err;
          }
        };
      }
    }
  }
}
