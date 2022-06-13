/* eslint-disable */

import { ExecutionResult } from "graphql";

export type Maybe<T> = T | null | undefined;

export function typeRef<T>(value?: T | null): T {
  return {} as T;
}

export const BossesDocument = "query Bosses{bosses{id name location{id name}}}";

export type XBosses<TExtensions> = ExecutionResult<DBosses, TExtensions>;

export type DBosses = {
  bosses: Maybe<
    Array<{
      id: string;

      name: string;

      location: {
        id: string;

        name: string;
      };
    }>
  >;
};

export const CompareBossDifficultyDocument =
  "query CompareBossDifficulty($left:ID!$right:ID!){left:boss(id:$left){...compareBossDifficultyData}right:boss(id:$right){...compareBossDifficultyData}}\n\nfragment compareBossDifficultyData on Boss{id name reviews{difficulty}}";

export interface VCompareBossDifficulty {
  left: string;
  right: string;
}

export type XCompareBossDifficulty<TExtensions> = ExecutionResult<
  DCompareBossDifficulty,
  TExtensions
>;

export type DCompareBossDifficulty = {
  left: Maybe<{} & FCompareBossDifficultyData>;

  right: Maybe<{} & FCompareBossDifficultyData>;
};

export const CreateBossReviewDocument =
  "mutation CreateBossReview($input:CreateBossReviewInput!){createBossReview(input:$input){id}}";

export interface VCreateBossReview {
  input: TCreateBossReviewInput;
}

export type XCreateBossReview<TExtensions> = ExecutionResult<
  DCreateBossReview,
  TExtensions
>;

export type DCreateBossReview = {
  createBossReview: Maybe<{
    id: string;
  }>;
};

export const CreateLocationReviewDocument =
  "mutation CreateLocationReview($input:CreateLocationReviewInput!){createLocationReview(input:$input){id}}";

export interface VCreateLocationReview {
  input: TCreateLocationReviewInput;
}

export type XCreateLocationReview<TExtensions> = ExecutionResult<
  DCreateLocationReview,
  TExtensions
>;

export type DCreateLocationReview = {
  createLocationReview: Maybe<{
    id: string;
  }>;
};

export const DivideDocument =
  "query Divide($dividend:ESNumber!$divisor:ESNumber!){divide(dividend:$dividend divisor:$divisor)}";

export interface VDivide {
  dividend: unknown;
  divisor: unknown;
}

export type XDivide<TExtensions> = ExecutionResult<DDivide, TExtensions>;

export type DDivide = {
  divide: Maybe<unknown>;
};

export const LocationsDocument =
  "query Locations($skipBosses:Boolean=false$includeReviews:Boolean=false){locations{id name bosses@skip(if:$skipBosses){id name reviews@include(if:$includeReviews){difficulty}}}}";

export interface VLocations {
  skipBosses?: boolean;
  includeReviews?: boolean;
}

export type XLocations<TExtensions> = ExecutionResult<DLocations, TExtensions>;

export type DLocations = {
  locations: Maybe<
    Array<{
      id: string;

      name: string;

      bosses: Maybe<
        Array<{
          id: string;

          name: string;

          reviews: Maybe<
            Array<{
              difficulty: TDifficulty;
            }>
          >;
        }>
      >;
    }>
  >;
};

export const ReviewsDocument =
  "query Reviews{reviews{...reviewData}}\n\nfragment reviewData on Review{__typename ...on BossReview{boss{id name}difficulty theme ...reviewMetadata}...on LocationReview{location{id name}difficulty design ...reviewMetadata}}\n\nfragment reviewMetadata on Review{id author createdAt}";

export type XReviews<TExtensions> = ExecutionResult<DReviews, TExtensions>;

export type DReviews = {
  reviews: Maybe<Array<({} & FReviewData) | ({} & FReviewData)>>;
};

export const NewReviewsDocument =
  "subscription NewReviews($limit:Int){newReview(limit:$limit){...reviewData}}\n\nfragment reviewData on Review{__typename ...on BossReview{boss{id name}difficulty theme ...reviewMetadata}...on LocationReview{location{id name}difficulty design ...reviewMetadata}}\n\nfragment reviewMetadata on Review{id author createdAt}";

export interface VNewReviews {
  limit?: number;
}

export type XNewReviews<TExtensions> = ExecutionResult<
  DNewReviews,
  TExtensions
>;

export type DNewReviews = {
  newReview: ({} & FReviewData) | ({} & FReviewData);
};

export const SearchDocument =
  "query Search($q:String!$types:[SearchType!]){search(q:$q types:$types){__typename ...on Boss{id name}...on Location{id name}}}";

export interface VSearch {
  q: string;
  types?: Array<TSearchType>;
}

export type XSearch<TExtensions> = ExecutionResult<DSearch, TExtensions>;

export type DSearch = {
  search: Maybe<
    Array<
      | ({
          __typename: "Boss";
        } & {
          id: string;

          name: string;
        })
      | ({
          __typename: "Location";
        } & {
          id: string;

          name: string;
        })
    >
  >;
};

export type FCompareBossDifficultyData = {
  id: string;

  name: string;

  reviews: Maybe<
    Array<{
      difficulty: TDifficulty;
    }>
  >;
};

export type FReviewData =
  | ({
      __typename: "BossReview";
    } & ({
      boss: {
        id: string;

        name: string;
      };

      difficulty: TDifficulty;

      theme: TRating;
    } & FReviewMetadata))
  | ({
      __typename: "LocationReview";
    } & ({
      location: {
        id: string;

        name: string;
      };

      difficulty: TDifficulty;

      design: TRating;
    } & FReviewMetadata));

export type FReviewMetadata =
  | {
      id: string;

      author: Maybe<string>;

      createdAt: string;
    }
  | {
      id: string;

      author: Maybe<string>;

      createdAt: string;
    };

export interface TCreateBossReviewInput {
  /**
   * (String)
   */
  author?: string;

  /**
   * (ID)
   */
  bossId: string;

  difficulty: TDifficulty;

  theme: TRating;
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

  difficulty: TDifficulty;

  design: TRating;
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

export const OperationNameToDocument = {
  Bosses: BossesDocument,
  CompareBossDifficulty: CompareBossDifficultyDocument,
  CreateBossReview: CreateBossReviewDocument,
  CreateLocationReview: CreateLocationReviewDocument,
  Divide: DivideDocument,
  Locations: LocationsDocument,
  Reviews: ReviewsDocument,
  NewReviews: NewReviewsDocument,
  Search: SearchDocument,
};

export interface OperationNameToVariables {
  Bosses: undefined;
  CompareBossDifficulty: VCompareBossDifficulty;
  CreateBossReview: VCreateBossReview;
  CreateLocationReview: VCreateLocationReview;
  Divide: VDivide;
  Locations: VLocations;
  Reviews: undefined;
  NewReviews: VNewReviews;
  Search: VSearch;
}

export interface OperationNameToData {
  Bosses: DBosses;
  CompareBossDifficulty: DCompareBossDifficulty;
  CreateBossReview: DCreateBossReview;
  CreateLocationReview: DCreateLocationReview;
  Divide: DDivide;
  Locations: DLocations;
  Reviews: DReviews;
  NewReviews: DNewReviews;
  Search: DSearch;
}

export type OperationName = QueryName | MutationName | SubscriptionName;

export type QueryName =
  | "Bosses"
  | "CompareBossDifficulty"
  | "Divide"
  | "Locations"
  | "Reviews"
  | "Search";

export type MutationName = "CreateBossReview" | "CreateLocationReview";

export type SubscriptionName = "NewReviews";

export interface OperationTypings {
  OperationName: OperationName;
  QueryName: QueryName;
  MutationName: MutationName;
  SubscriptionName: SubscriptionName;
  OperationNameToVariables: OperationNameToVariables;
  OperationNameToData: OperationNameToData;
  OperationNameToDocument: Record<OperationName, string>;
}

export const typings = {
  OperationNameToDocument,
} as unknown as OperationTypings;
