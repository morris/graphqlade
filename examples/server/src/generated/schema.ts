/* eslint-disable */

import {
  GraphQLResolveInfo,
  GraphQLEnumType,
  GraphQLScalarType,
} from "graphql";
import { BossData, LocationData, ReviewData } from "../types";

export type AsyncResult<T> = T | Promise<T>;
export type Maybe<T> = T | null | undefined;

export interface ResolverMap<TContext> {
  __isGeneratedResolverMap?: TContext;

  Mutation?: RMutation<TContext>;

  Boolean?: GraphQLScalarType;

  CreateBossReviewInput?: undefined;

  String?: GraphQLScalarType;

  ID?: GraphQLScalarType;

  CreateLocationReviewInput?: undefined;

  Query?: RQuery<TContext>;

  Boss?: RBoss<TContext>;

  Location?: RLocation<TContext>;

  Review?: RReview<TContext>;

  BossReview?: RBossReview<TContext>;

  LocationReview?: RLocationReview<TContext>;

  Rating?: ERating | GraphQLEnumType;

  Difficulty?: EDifficulty | GraphQLEnumType;

  SearchType?: ESearchType | GraphQLEnumType;

  SearchResult?: RSearchResult<TContext>;

  IsFiniteResult?: RIsFiniteResult<TContext>;

  Subscription?: RSubscription<TContext>;

  Int?: GraphQLScalarType;

  Date?: GraphQLScalarType;

  Time?: GraphQLScalarType;

  DateTime?: GraphQLScalarType;

  UUID?: GraphQLScalarType;

  JSON?: GraphQLScalarType;

  ESNumber?: GraphQLScalarType;

  __Schema?: R__Schema<TContext>;

  __Type?: R__Type<TContext>;

  __TypeKind?: E__TypeKind | GraphQLEnumType;

  __Field?: R__Field<TContext>;

  __InputValue?: R__InputValue<TContext>;

  __EnumValue?: R__EnumValue<TContext>;

  __Directive?: R__Directive<TContext>;

  __DirectiveLocation?: E__DirectiveLocation | GraphQLEnumType;
}

export interface RMutation<TContext> {
  __isTypeOf?: (
    source: TMutation,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (Boolean)
   */
  youDied?: (
    source: TMutation,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<boolean>>;

  /**
   * (BossReview)
   */
  createBossReview?: (
    source: TMutation,
    args: MutationCreateBossReviewArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<ReviewData>>;

  /**
   * (LocationReview)
   */
  createLocationReview?: (
    source: TMutation,
    args: MutationCreateLocationReviewArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<ReviewData>>;
}

export interface RQuery<TContext> {
  __isTypeOf?: (
    source: TQuery,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (String)
   */
  praise?: (
    source: TQuery,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (Array<Boss>)
   */
  bosses?: (
    source: TQuery,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<BossData>>>;

  /**
   * (Boss)
   */
  boss?: (
    source: TQuery,
    args: QueryBossArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<BossData>>;

  /**
   * (Array<Location>)
   */
  locations?: (
    source: TQuery,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<LocationData>>>;

  /**
   * (Location)
   */
  location?: (
    source: TQuery,
    args: QueryLocationArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<LocationData>>;

  /**
   * (Array<Review>)
   */
  reviews?: (
    source: TQuery,
    args: QueryReviewsArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<ReviewData>>>;

  search?: (
    source: TQuery,
    args: QuerySearchArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<TSearchResult>>>;

  isFinite?: (
    source: TQuery,
    args: QueryIsFiniteArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<TIsFiniteResult>>;

  /**
   * (ESNumber)
   */
  divide?: (
    source: TQuery,
    args: QueryDivideArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<number>>;
}

export interface RBoss<TContext> {
  __isTypeOf?: (
    source: BossData,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (ID)
   */
  id?: (
    source: BossData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  name?: (
    source: BossData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (Boolean)
   */
  optional?: (
    source: BossData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<boolean>;

  /**
   * (Location)
   */
  location?: (
    source: BossData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<LocationData>;

  /**
   * (Array<BossReview>)
   */
  reviews?: (
    source: BossData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<ReviewData>>>;
}

export interface RLocation<TContext> {
  __isTypeOf?: (
    source: LocationData,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (ID)
   */
  id?: (
    source: LocationData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  name?: (
    source: LocationData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (Array<Boss>)
   */
  bosses?: (
    source: LocationData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<BossData>>>;

  /**
   * (Array<LocationReview>)
   */
  reviews?: (
    source: LocationData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<ReviewData>>>;
}

export interface RReview<TContext> {
  __resolveType?: (
    source: ReviewData,
    context: TContext,
    info: GraphQLResolveInfo
  ) => string;
  /**
   * (UUID)
   */
  id?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  author?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (DateTime)
   */
  createdAt?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string | number | Date>;
}

export interface RBossReview<TContext> {
  __isTypeOf?: (
    source: ReviewData,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (UUID)
   */
  id?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  author?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (DateTime)
   */
  createdAt?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string | number | Date>;

  /**
   * (Boss)
   */
  boss?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<BossData>;

  /**
   * (Difficulty)
   */
  difficulty?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (Rating)
   */
  theme?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<number>;
}

export interface RLocationReview<TContext> {
  __isTypeOf?: (
    source: ReviewData,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (UUID)
   */
  id?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  author?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (DateTime)
   */
  createdAt?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string | number | Date>;

  /**
   * (Location)
   */
  location?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<LocationData>;

  /**
   * (Difficulty)
   */
  difficulty?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (Rating)
   */
  design?: (
    source: ReviewData,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<number>;
}

export interface RSearchResult<TContext> {
  __resolveType?: (
    source: TSearchResult,
    context: TContext,
    info: GraphQLResolveInfo
  ) => string;
}

export interface RIsFiniteResult<TContext> {
  __isTypeOf?: (
    source: TIsFiniteResult,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (ESNumber)
   */
  input?: (
    source: TIsFiniteResult,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<number>;

  /**
   * (Boolean)
   */
  result?: (
    source: TIsFiniteResult,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<boolean>;
}

export interface RSubscription<TContext> {
  __isTypeOf?: (
    source: TSubscription,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (Review)
   */
  newReview?: (
    source: TSubscription,
    args: SubscriptionNewReviewArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<ReviewData>;
}

/**
 * A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.
 */
export interface R__Schema<TContext> {
  __isTypeOf?: (
    source: T__Schema,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (String)
   */
  description?: (
    source: T__Schema,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * A list of all types supported by this server.
   */
  types?: (
    source: T__Schema,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Array<T__Type>>;

  /**
   * The type that query operations will be rooted at.
   */
  queryType?: (
    source: T__Schema,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<T__Type>;

  /**
   * If this server supports mutation, the type that mutation operations will be rooted at.
   */
  mutationType?: (
    source: T__Schema,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<T__Type>>;

  /**
   * If this server support subscription, the type that subscription operations will be rooted at.
   */
  subscriptionType?: (
    source: T__Schema,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<T__Type>>;

  /**
   * A list of all directives supported by this server.
   */
  directives?: (
    source: T__Schema,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Array<T__Directive>>;
}

/**
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.
 *
 * Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.
 */
export interface R__Type<TContext> {
  __isTypeOf?: (
    source: T__Type,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;

  kind?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<T__TypeKind>;

  /**
   * (String)
   */
  name?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (String)
   */
  description?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (String)
   */
  specifiedByURL?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  fields?: (
    source: T__Type,
    args: __TypeFieldsArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<T__Field>>>;

  interfaces?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<T__Type>>>;

  possibleTypes?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<T__Type>>>;

  enumValues?: (
    source: T__Type,
    args: __TypeEnumValuesArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<T__EnumValue>>>;

  inputFields?: (
    source: T__Type,
    args: __TypeInputFieldsArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<Array<T__InputValue>>>;

  ofType?: (
    source: T__Type,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<T__Type>>;
}

/**
 * Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.
 */
export interface R__Field<TContext> {
  __isTypeOf?: (
    source: T__Field,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (String)
   */
  name?: (
    source: T__Field,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  description?: (
    source: T__Field,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  args?: (
    source: T__Field,
    args: __FieldArgsArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Array<T__InputValue>>;

  type?: (
    source: T__Field,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<T__Type>;

  /**
   * (Boolean)
   */
  isDeprecated?: (
    source: T__Field,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<boolean>;

  /**
   * (String)
   */
  deprecationReason?: (
    source: T__Field,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;
}

/**
 * Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.
 */
export interface R__InputValue<TContext> {
  __isTypeOf?: (
    source: T__InputValue,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (String)
   */
  name?: (
    source: T__InputValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  description?: (
    source: T__InputValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  type?: (
    source: T__InputValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<T__Type>;

  /**
   * (String) A GraphQL-formatted string representing the default value for this input value.
   */
  defaultValue?: (
    source: T__InputValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (Boolean)
   */
  isDeprecated?: (
    source: T__InputValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<boolean>;

  /**
   * (String)
   */
  deprecationReason?: (
    source: T__InputValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;
}

/**
 * One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.
 */
export interface R__EnumValue<TContext> {
  __isTypeOf?: (
    source: T__EnumValue,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (String)
   */
  name?: (
    source: T__EnumValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  description?: (
    source: T__EnumValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (Boolean)
   */
  isDeprecated?: (
    source: T__EnumValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<boolean>;

  /**
   * (String)
   */
  deprecationReason?: (
    source: T__EnumValue,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;
}

/**
 * A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.
 *
 * In some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.
 */
export interface R__Directive<TContext> {
  __isTypeOf?: (
    source: T__Directive,
    context: TContext,
    info: GraphQLResolveInfo
  ) => boolean;
  /**
   * (String)
   */
  name?: (
    source: T__Directive,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<string>;

  /**
   * (String)
   */
  description?: (
    source: T__Directive,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Maybe<string>>;

  /**
   * (Boolean)
   */
  isRepeatable?: (
    source: T__Directive,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<boolean>;

  locations?: (
    source: T__Directive,
    args: Record<string, never>,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Array<T__DirectiveLocation>>;

  args?: (
    source: T__Directive,
    args: __DirectiveArgsArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<Array<T__InputValue>>;
}

export interface ERating {
  TERRIBLE: number;

  MEH: number;

  ALRIGHT: number;

  AMAZING: number;

  STELLAR: number;
}

export interface EDifficulty {
  OKAYISH: string;

  HARD: string;

  IMPOSSIBLE: string;
}

export interface ESearchType {
  BOSSES: TSearchType;

  LOCATIONS: TSearchType;
}

/**
 * An enum describing what kind of type a given `__Type` is.
 */
export interface E__TypeKind {
  /**
   * Indicates this type is a scalar.
   */
  SCALAR: T__TypeKind;
  /**
   * Indicates this type is an object. `fields` and `interfaces` are valid fields.
   */
  OBJECT: T__TypeKind;
  /**
   * Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields.
   */
  INTERFACE: T__TypeKind;
  /**
   * Indicates this type is a union. `possibleTypes` is a valid field.
   */
  UNION: T__TypeKind;
  /**
   * Indicates this type is an enum. `enumValues` is a valid field.
   */
  ENUM: T__TypeKind;
  /**
   * Indicates this type is an input object. `inputFields` is a valid field.
   */
  INPUT_OBJECT: T__TypeKind;
  /**
   * Indicates this type is a list. `ofType` is a valid field.
   */
  LIST: T__TypeKind;
  /**
   * Indicates this type is a non-null. `ofType` is a valid field.
   */
  NON_NULL: T__TypeKind;
}

/**
 * A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.
 */
export interface E__DirectiveLocation {
  /**
   * Location adjacent to a query operation.
   */
  QUERY: T__DirectiveLocation;
  /**
   * Location adjacent to a mutation operation.
   */
  MUTATION: T__DirectiveLocation;
  /**
   * Location adjacent to a subscription operation.
   */
  SUBSCRIPTION: T__DirectiveLocation;
  /**
   * Location adjacent to a field.
   */
  FIELD: T__DirectiveLocation;
  /**
   * Location adjacent to a fragment definition.
   */
  FRAGMENT_DEFINITION: T__DirectiveLocation;
  /**
   * Location adjacent to a fragment spread.
   */
  FRAGMENT_SPREAD: T__DirectiveLocation;
  /**
   * Location adjacent to an inline fragment.
   */
  INLINE_FRAGMENT: T__DirectiveLocation;
  /**
   * Location adjacent to a variable definition.
   */
  VARIABLE_DEFINITION: T__DirectiveLocation;
  /**
   * Location adjacent to a schema definition.
   */
  SCHEMA: T__DirectiveLocation;
  /**
   * Location adjacent to a scalar definition.
   */
  SCALAR: T__DirectiveLocation;
  /**
   * Location adjacent to an object type definition.
   */
  OBJECT: T__DirectiveLocation;
  /**
   * Location adjacent to a field definition.
   */
  FIELD_DEFINITION: T__DirectiveLocation;
  /**
   * Location adjacent to an argument definition.
   */
  ARGUMENT_DEFINITION: T__DirectiveLocation;
  /**
   * Location adjacent to an interface definition.
   */
  INTERFACE: T__DirectiveLocation;
  /**
   * Location adjacent to a union definition.
   */
  UNION: T__DirectiveLocation;
  /**
   * Location adjacent to an enum definition.
   */
  ENUM: T__DirectiveLocation;
  /**
   * Location adjacent to an enum value definition.
   */
  ENUM_VALUE: T__DirectiveLocation;
  /**
   * Location adjacent to an input object type definition.
   */
  INPUT_OBJECT: T__DirectiveLocation;
  /**
   * Location adjacent to an input object field definition.
   */
  INPUT_FIELD_DEFINITION: T__DirectiveLocation;
}

export interface SSubscription<TContext> {
  __isGeneratedSubscriptionResolver?: TContext;

  /**
   * (Review)
   */
  newReview?: (
    source: TSubscription,
    args: SubscriptionNewReviewArgs,
    context: TContext,
    info: GraphQLResolveInfo
  ) => AsyncResult<AsyncIterableIterator<{ newReview: ReviewData }>>;
}

export interface TMutation {
  /**
   * (Boolean)
   */
  youDied?: boolean;

  /**
   * (BossReview)
   */
  createBossReview?: ReviewData;

  /**
   * (LocationReview)
   */
  createLocationReview?: ReviewData;
}

export interface TQuery {
  /**
   * (String)
   */
  praise: string;

  /**
   * (Array<Boss>)
   */
  bosses?: Array<BossData>;

  /**
   * (Boss)
   */
  boss?: BossData;

  /**
   * (Array<Location>)
   */
  locations?: Array<LocationData>;

  /**
   * (Location)
   */
  location?: LocationData;

  /**
   * (Array<Review>)
   */
  reviews?: Array<ReviewData>;

  search?: Array<TSearchResult>;

  isFinite?: TIsFiniteResult;

  /**
   * (ESNumber)
   */
  divide?: number;
}

export interface TBoss {
  /**
   * (ID)
   */
  id: string;

  /**
   * (String)
   */
  name: string;

  /**
   * (Boolean)
   */
  optional: boolean;

  /**
   * (Location)
   */
  location: LocationData;

  /**
   * (Array<BossReview>)
   */
  reviews?: Array<ReviewData>;
}

export interface TLocation {
  /**
   * (ID)
   */
  id: string;

  /**
   * (String)
   */
  name: string;

  /**
   * (Array<Boss>)
   */
  bosses?: Array<BossData>;

  /**
   * (Array<LocationReview>)
   */
  reviews?: Array<ReviewData>;
}

export interface TReview {
  /**
   * (UUID)
   */
  id: string;

  /**
   * (String)
   */
  author?: string;

  /**
   * (DateTime)
   */
  createdAt: string | number | Date;
}

export interface TBossReview {
  /**
   * (UUID)
   */
  id: string;

  /**
   * (String)
   */
  author?: string;

  /**
   * (DateTime)
   */
  createdAt: string | number | Date;

  /**
   * (Boss)
   */
  boss: BossData;

  /**
   * (Difficulty)
   */
  difficulty: string;

  /**
   * (Rating)
   */
  theme: number;
}

export interface TLocationReview {
  /**
   * (UUID)
   */
  id: string;

  /**
   * (String)
   */
  author?: string;

  /**
   * (DateTime)
   */
  createdAt: string | number | Date;

  /**
   * (Location)
   */
  location: LocationData;

  /**
   * (Difficulty)
   */
  difficulty: string;

  /**
   * (Rating)
   */
  design: number;
}

export type TSearchResult = BossData | LocationData;

export interface TIsFiniteResult {
  /**
   * (ESNumber)
   */
  input: number;

  /**
   * (Boolean)
   */
  result: boolean;
}

export interface TSubscription {
  /**
   * (Review)
   */
  newReview: ReviewData;
}

/**
 * A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.
 */
export interface T__Schema {
  /**
   * (String)
   */
  description?: string;

  /**
   * A list of all types supported by this server.
   */
  types: Array<T__Type>;

  /**
   * The type that query operations will be rooted at.
   */
  queryType: T__Type;

  /**
   * If this server supports mutation, the type that mutation operations will be rooted at.
   */
  mutationType?: T__Type;

  /**
   * If this server support subscription, the type that subscription operations will be rooted at.
   */
  subscriptionType?: T__Type;

  /**
   * A list of all directives supported by this server.
   */
  directives: Array<T__Directive>;
}

/**
 * The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.
 *
 * Depending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.
 */
export interface T__Type {
  kind: T__TypeKind;

  /**
   * (String)
   */
  name?: string;

  /**
   * (String)
   */
  description?: string;

  /**
   * (String)
   */
  specifiedByURL?: string;

  fields?: Array<T__Field>;

  interfaces?: Array<T__Type>;

  possibleTypes?: Array<T__Type>;

  enumValues?: Array<T__EnumValue>;

  inputFields?: Array<T__InputValue>;

  ofType?: T__Type;
}

/**
 * Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.
 */
export interface T__Field {
  /**
   * (String)
   */
  name: string;

  /**
   * (String)
   */
  description?: string;

  args: Array<T__InputValue>;

  type: T__Type;

  /**
   * (Boolean)
   */
  isDeprecated: boolean;

  /**
   * (String)
   */
  deprecationReason?: string;
}

/**
 * Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.
 */
export interface T__InputValue {
  /**
   * (String)
   */
  name: string;

  /**
   * (String)
   */
  description?: string;

  type: T__Type;

  /**
   * (String) A GraphQL-formatted string representing the default value for this input value.
   */
  defaultValue?: string;

  /**
   * (Boolean)
   */
  isDeprecated: boolean;

  /**
   * (String)
   */
  deprecationReason?: string;
}

/**
 * One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.
 */
export interface T__EnumValue {
  /**
   * (String)
   */
  name: string;

  /**
   * (String)
   */
  description?: string;

  /**
   * (Boolean)
   */
  isDeprecated: boolean;

  /**
   * (String)
   */
  deprecationReason?: string;
}

/**
 * A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.
 *
 * In some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.
 */
export interface T__Directive {
  /**
   * (String)
   */
  name: string;

  /**
   * (String)
   */
  description?: string;

  /**
   * (Boolean)
   */
  isRepeatable: boolean;

  locations: Array<T__DirectiveLocation>;

  args: Array<T__InputValue>;
}

export interface MutationCreateBossReviewArgs {
  input: TCreateBossReviewInput;
}

export interface MutationCreateLocationReviewArgs {
  input: TCreateLocationReviewInput;
}

export interface QueryBossArgs {
  /**
   * (ID)
   */
  id: string;
}

export interface QueryLocationArgs {
  /**
   * (ID)
   */
  id: string;
}

export interface QueryReviewsArgs {
  /**
   * (DateTime)
   */
  after?: Date;

  /**
   * (DateTime)
   */
  before?: Date;
}

export interface QuerySearchArgs {
  /**
   * (String)
   */
  q: string;

  types?: Array<TSearchType>;
}

export interface QueryIsFiniteArgs {
  /**
   * (ESNumber)
   */
  input: number;
}

export interface QueryDivideArgs {
  /**
   * (ESNumber)
   */
  dividend: number;

  /**
   * (ESNumber)
   */
  divisor: number;
}

export interface SubscriptionNewReviewArgs {
  /**
   * (Int)
   */
  limit?: number;
}

export interface __TypeFieldsArgs {
  /**
   * (Boolean)
   */
  includeDeprecated?: boolean;
}

export interface __TypeEnumValuesArgs {
  /**
   * (Boolean)
   */
  includeDeprecated?: boolean;
}

export interface __TypeInputFieldsArgs {
  /**
   * (Boolean)
   */
  includeDeprecated?: boolean;
}

export interface __FieldArgsArgs {
  /**
   * (Boolean)
   */
  includeDeprecated?: boolean;
}

export interface __DirectiveArgsArgs {
  /**
   * (Boolean)
   */
  includeDeprecated?: boolean;
}

export interface TCreateBossReviewInput {
  /**
   * (String)
   */
  author?: string;

  /**
   * (ID)
   */
  bossId: string;

  /**
   * (Difficulty)
   */
  difficulty: string;

  /**
   * (Rating)
   */
  theme: number;
}

export interface TCreateLocationReviewInput {
  /**
   * (String)
   */
  author?: string;

  /**
   * (ID)
   */
  locationId: string;

  /**
   * (Difficulty)
   */
  difficulty: string;

  /**
   * (Rating)
   */
  design: number;
}

export enum TRating {
  TERRIBLE = "TERRIBLE",

  MEH = "MEH",

  ALRIGHT = "ALRIGHT",

  AMAZING = "AMAZING",

  STELLAR = "STELLAR",
}

export enum TDifficulty {
  OKAYISH = "OKAYISH",

  HARD = "HARD",

  IMPOSSIBLE = "IMPOSSIBLE",
}

export enum TSearchType {
  BOSSES = "BOSSES",

  LOCATIONS = "LOCATIONS",
}

/**
 * An enum describing what kind of type a given `__Type` is.
 */
export enum T__TypeKind {
  /**
   * Indicates this type is a scalar.
   */
  SCALAR = "SCALAR",
  /**
   * Indicates this type is an object. `fields` and `interfaces` are valid fields.
   */
  OBJECT = "OBJECT",
  /**
   * Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields.
   */
  INTERFACE = "INTERFACE",
  /**
   * Indicates this type is a union. `possibleTypes` is a valid field.
   */
  UNION = "UNION",
  /**
   * Indicates this type is an enum. `enumValues` is a valid field.
   */
  ENUM = "ENUM",
  /**
   * Indicates this type is an input object. `inputFields` is a valid field.
   */
  INPUT_OBJECT = "INPUT_OBJECT",
  /**
   * Indicates this type is a list. `ofType` is a valid field.
   */
  LIST = "LIST",
  /**
   * Indicates this type is a non-null. `ofType` is a valid field.
   */
  NON_NULL = "NON_NULL",
}

/**
 * A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.
 */
export enum T__DirectiveLocation {
  /**
   * Location adjacent to a query operation.
   */
  QUERY = "QUERY",
  /**
   * Location adjacent to a mutation operation.
   */
  MUTATION = "MUTATION",
  /**
   * Location adjacent to a subscription operation.
   */
  SUBSCRIPTION = "SUBSCRIPTION",
  /**
   * Location adjacent to a field.
   */
  FIELD = "FIELD",
  /**
   * Location adjacent to a fragment definition.
   */
  FRAGMENT_DEFINITION = "FRAGMENT_DEFINITION",
  /**
   * Location adjacent to a fragment spread.
   */
  FRAGMENT_SPREAD = "FRAGMENT_SPREAD",
  /**
   * Location adjacent to an inline fragment.
   */
  INLINE_FRAGMENT = "INLINE_FRAGMENT",
  /**
   * Location adjacent to a variable definition.
   */
  VARIABLE_DEFINITION = "VARIABLE_DEFINITION",
  /**
   * Location adjacent to a schema definition.
   */
  SCHEMA = "SCHEMA",
  /**
   * Location adjacent to a scalar definition.
   */
  SCALAR = "SCALAR",
  /**
   * Location adjacent to an object type definition.
   */
  OBJECT = "OBJECT",
  /**
   * Location adjacent to a field definition.
   */
  FIELD_DEFINITION = "FIELD_DEFINITION",
  /**
   * Location adjacent to an argument definition.
   */
  ARGUMENT_DEFINITION = "ARGUMENT_DEFINITION",
  /**
   * Location adjacent to an interface definition.
   */
  INTERFACE = "INTERFACE",
  /**
   * Location adjacent to a union definition.
   */
  UNION = "UNION",
  /**
   * Location adjacent to an enum definition.
   */
  ENUM = "ENUM",
  /**
   * Location adjacent to an enum value definition.
   */
  ENUM_VALUE = "ENUM_VALUE",
  /**
   * Location adjacent to an input object type definition.
   */
  INPUT_OBJECT = "INPUT_OBJECT",
  /**
   * Location adjacent to an input object field definition.
   */
  INPUT_FIELD_DEFINITION = "INPUT_FIELD_DEFINITION",
}

export interface TsDirective {
  /**
   * (String)
   */
  type: string;

  /**
   * (String)
   */
  inputType?: string;

  /**
   * (String)
   */
  from?: string;
}

export interface IncludeDirective {
  /**
   * (Boolean) Included when true.
   */
  if: boolean;
}

export interface SkipDirective {
  /**
   * (Boolean) Skipped when true.
   */
  if: boolean;
}

export interface DeprecatedDirective {
  /**
   * (String) Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).
   */
  reason?: string;
}

export interface SpecifiedByDirective {
  /**
   * (String) The URL that specifies the behavior of this scalar.
   */
  url: string;
}
