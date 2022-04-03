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
import { assertDefined } from "../util/assert";
import { toError } from "../util/toError";

export type AnyResolverMap<TContext> =
  | CustomResolverMap<TContext>
  | GeneratedResolverMap<TContext>;

export interface GeneratedResolverMap<TContext> {
  __isGeneratedResolverMap?: TContext;
}

export interface CustomResolverMap<TContext> {
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
    | GraphQLFieldResolver<TSource, TContext>;
}

export interface InterfaceResolver<TSource = unknown, TContext = unknown> {
  [fieldName: string]:
    | GraphQLTypeResolver<TSource, TContext>
    | GraphQLFieldResolver<TSource, TContext>;
}

export interface UnionResolver<TSource = unknown, TContext = unknown> {
  __resolveType?: GraphQLTypeResolver<TSource, TContext>;
}

export type SubscriptionResolver<TContext> =
  | CustomSubscriptionResolver<TContext>
  | GeneratedSubscriptionResolver<TContext>;

export interface CustomSubscriptionResolver<TContext> {
  [fieldName: string]: GraphQLFieldResolver<unknown, TContext>;
}

export interface GeneratedSubscriptionResolver<TContext> {
  __isGeneratedSubscriptionResolver?: TContext;
}

export type ResolverErrorHandler<TContext> = (
  err: Error,
  data: unknown,
  args: unknown,
  context: TContext,
  info: GraphQLResolveInfo
) => Error | undefined | void;

export class GraphQLSchemaManager<TContext> {
  protected schema: GraphQLSchema;

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
  }

  // default resolvers

  addDefaultFieldResolverToSchema(
    defaultFieldResolver: GraphQLFieldResolver<unknown, TContext>
  ) {
    for (const type of Object.values(this.schema.getTypeMap())) {
      this.addDefaultFieldResolverToType(type, defaultFieldResolver);
    }
  }

  addDefaultFieldResolverToType(
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

  // type resolvers

  addResolversToSchema(resolvers: AnyResolverMap<TContext>): void {
    const r = resolvers as CustomResolverMap<TContext>;

    for (const typeName of Object.keys(r)) {
      const resolver = r[typeName];
      const type = this.schema.getType(typeName);

      assertDefined(type, `Cannot set resolver for undefined type ${typeName}`);

      this.addResolversToType(type, resolver);
    }
  }

  addResolversToType(
    type: GraphQLNamedType,
    resolver: TypeResolver<unknown, TContext>
  ) {
    if (isObjectType(type)) {
      this.addResolversToObjectType(
        type,
        resolver as ObjectResolver<unknown, TContext>
      );
    } else if (isInterfaceType(type)) {
      this.addResolversToInterfaceType(
        type,
        resolver as InterfaceResolver<unknown, TContext>
      );
    } else if (isUnionType(type)) {
      this.addResolversToUnionType(
        type,
        resolver as UnionResolver<unknown, TContext>
      );
    } else if (isEnumType(type)) {
      this.addResolversToEnumType(
        type,
        isEnumType(resolver) ? resolver : (resolver as Record<string, unknown>)
      );
    } else if (isScalarType(type)) {
      this.addResolversToScalarType(type, assertScalarType(resolver));
    } else {
      throw new Error(`Cannot set resolver for ${type.name}`);
    }
  }

  addResolversToObjectType(
    type: GraphQLObjectType<unknown, TContext>,
    resolver: ObjectResolver<unknown, TContext>
  ) {
    type.isTypeOf =
      (resolver.__isTypeOf as GraphQLIsTypeOfFn<unknown, TContext>) ??
      type.isTypeOf;

    this.addFieldResolvers(type, resolver);
  }

  addResolversToInterfaceType(
    type: GraphQLInterfaceType,
    resolver: InterfaceResolver<unknown, TContext>
  ) {
    type.resolveType =
      (resolver.__resolveType as GraphQLTypeResolver<unknown, TContext>) ??
      type.resolveType;

    this.addFieldResolvers(type, resolver);
  }

  protected addFieldResolvers(
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

      field.resolve =
        field.resolve ??
        (resolver[fieldName] as GraphQLFieldResolver<unknown, TContext>);
    }
  }

  addResolversToUnionType(
    type: GraphQLUnionType,
    resolver: UnionResolver<unknown, TContext>
  ) {
    type.resolveType = resolver.__resolveType ?? type.resolveType;
  }

  addResolversToEnumType(
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

  addResolversToScalarType(
    type: GraphQLScalarType,
    resolver: GraphQLScalarType
  ) {
    type.parseLiteral = resolver.parseLiteral ?? type.parseLiteral;
    type.parseValue = resolver.parseValue ?? type.parseLiteral;
    type.serialize = resolver.serialize ?? type.serialize;
  }

  // resolver inheritance

  addInheritedResolversToSchema(resolvers: AnyResolverMap<TContext>): void {
    for (const typeName of Object.keys(resolvers)) {
      const type = this.schema.getType(typeName);

      assertDefined(type, `Cannot set resolver for undefined type ${typeName}`);

      this.addInheritedResolversToType(type, resolvers);
    }
  }

  addInheritedResolversToType(
    type: GraphQLNamedType,
    resolvers: AnyResolverMap<TContext>
  ) {
    if (!isObjectType(type) && !isInterfaceType(type)) return;

    const r = resolvers as CustomResolverMap<TContext>;

    for (const implementedInterface of type.getInterfaces()) {
      const resolver = r[implementedInterface.name];
      this.addResolversToType(type, resolver);
    }
  }

  // subscription resolver

  addSubscriptionResolverToSchema(resolver: SubscriptionResolver<TContext>) {
    const subscriptionType = this.schema.getSubscriptionType();

    assertDefined(
      subscriptionType,
      "Cannot add subscription resolver as schema does not define a subscription type"
    );

    const fields = subscriptionType.getFields();
    const r = resolver as CustomSubscriptionResolver<TContext>;

    for (const fieldName of Object.keys(r)) {
      fields[fieldName].subscribe = r[fieldName];
    }
  }

  // resolve error handling

  setResolverErrorHandler(handler: ResolverErrorHandler<TContext>) {
    for (const type of Object.values(this.schema.getTypeMap())) {
      this.setResolverErrorHandlerOnType(type, handler);
    }
  }

  setResolverErrorHandlerOnType(
    type: GraphQLNamedType,
    handler: ResolverErrorHandler<TContext>
  ) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        const originalResolve = field.resolve ?? defaultFieldResolver;

        field.resolve = async (data, args, context, info) => {
          try {
            return await originalResolve(data, args, context, info);
          } catch (err) {
            const newErr = handler(toError(err), data, args, context, info);

            throw newErr ?? err;
          }
        };
      }
    }
  }
}
