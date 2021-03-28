/* eslint-disable */

import { ExecutionResult } from "graphql";

export type Maybe<T> = T | null | undefined;

export function typeRef<T>(value?: T | null): T {
  return {} as T;
}

export abstract class AbstractClient<
  TExtensions = Record<string, unknown>,
  TOperationExtra = unknown,
  TExecutionResultExtra = unknown
> {
  async query<TVariables, TExecutionResult>(
    document: string,
    operationName: string,
    variables: TVariables,
    extra?: TOperationExtra
  ): Promise<TExecutionResult & TExecutionResultExtra> {
    throw new Error("AbstractClient.query not implemented");
  }

  async mutate<TVariables, TExecutionResult>(
    document: string,
    operationName: string,
    variables: TVariables,
    extra?: TOperationExtra
  ): Promise<TExecutionResult & TExecutionResultExtra> {
    return this.query(document, operationName, variables, extra);
  }

  subscribe<TVariables, TExecutionResult>(
    document: string,
    operationName: string,
    variables: TVariables,
    extra?: TOperationExtra
  ): AsyncIterableIterator<TExecutionResult & TExecutionResultExtra> {
    throw new Error("AbstractClient.subscribe not implemented");
  }

  async queryBosses(
    variables?: undefined,
    extra?: TOperationExtra
  ): Promise<XBosses<TExtensions> & TExecutionResultExtra> {
    return this.query(BossesDocument, "Bosses", variables, extra);
  }

  async queryCompareBossDifficulty(
    variables: VCompareBossDifficulty,
    extra?: TOperationExtra
  ): Promise<XCompareBossDifficulty<TExtensions> & TExecutionResultExtra> {
    return this.query(
      CompareBossDifficultyDocument,
      "CompareBossDifficulty",
      variables,
      extra
    );
  }

  async mutateCreateBossReview(
    variables: VCreateBossReview,
    extra?: TOperationExtra
  ): Promise<XCreateBossReview<TExtensions> & TExecutionResultExtra> {
    return this.mutate(
      CreateBossReviewDocument,
      "CreateBossReview",
      variables,
      extra
    );
  }

  async mutateCreateLocationReview(
    variables: VCreateLocationReview,
    extra?: TOperationExtra
  ): Promise<XCreateLocationReview<TExtensions> & TExecutionResultExtra> {
    return this.mutate(
      CreateLocationReviewDocument,
      "CreateLocationReview",
      variables,
      extra
    );
  }

  async queryLocations(
    variables?: undefined,
    extra?: TOperationExtra
  ): Promise<XLocations<TExtensions> & TExecutionResultExtra> {
    return this.query(LocationsDocument, "Locations", variables, extra);
  }

  async queryReviews(
    variables?: undefined,
    extra?: TOperationExtra
  ): Promise<XReviews<TExtensions> & TExecutionResultExtra> {
    return this.query(ReviewsDocument, "Reviews", variables, extra);
  }

  subscribeNewReviews(
    variables: VNewReviews,
    extra?: TOperationExtra
  ): AsyncIterableIterator<XNewReviews<TExtensions> & TExecutionResultExtra> {
    return this.subscribe(NewReviewsDocument, "NewReviews", variables, extra);
  }

  async querySearch(
    variables: VSearch,
    extra?: TOperationExtra
  ): Promise<XSearch<TExtensions> & TExecutionResultExtra> {
    return this.query(SearchDocument, "Search", variables, extra);
  }
}

export const BossesDocument =
  "query Bosses {\n  bosses {\n    id\n    name\n    location {\n      id\n      name\n    }\n  }\n}";

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
  "query CompareBossDifficulty($left: ID!, $right: ID!) {\n  left: boss(id: $left) {\n    ...compareBossDifficultyData\n  }\n  right: boss(id: $right) {\n    ...compareBossDifficultyData\n  }\n}\n\nfragment compareBossDifficultyData on Boss {\n  id\n  name\n  reviews {\n    difficulty\n  }\n}";

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
  "mutation CreateBossReview($input: CreateBossReviewInput!) {\n  createBossReview(input: $input) {\n    id\n  }\n}";

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
  "mutation CreateLocationReview($input: CreateLocationReviewInput!) {\n  createLocationReview(input: $input) {\n    id\n  }\n}";

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

export const LocationsDocument =
  "query Locations {\n  locations {\n    id\n    name\n    bosses {\n      id\n      name\n    }\n  }\n}";

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
        }>
      >;
    }>
  >;
};

export const ReviewsDocument =
  "query Reviews {\n  reviews {\n    ...reviewData\n  }\n}\n\nfragment reviewData on Review {\n  __typename\n  ... on BossReview {\n    boss {\n      id\n      name\n    }\n    difficulty\n    theme\n    ...reviewMetadata\n  }\n  ... on LocationReview {\n    location {\n      id\n      name\n    }\n    difficulty\n    design\n    ...reviewMetadata\n  }\n}\n\nfragment reviewMetadata on Review {\n  id\n  author\n  createdAt\n}";

export type XReviews<TExtensions> = ExecutionResult<DReviews, TExtensions>;

export type DReviews = {
  reviews: Maybe<Array<({} & FReviewData) | ({} & FReviewData)>>;
};

export const NewReviewsDocument =
  "subscription NewReviews($limit: Int) {\n  newReview(limit: $limit) {\n    ...reviewData\n  }\n}\n\nfragment reviewData on Review {\n  __typename\n  ... on BossReview {\n    boss {\n      id\n      name\n    }\n    difficulty\n    theme\n    ...reviewMetadata\n  }\n  ... on LocationReview {\n    location {\n      id\n      name\n    }\n    difficulty\n    design\n    ...reviewMetadata\n  }\n}\n\nfragment reviewMetadata on Review {\n  id\n  author\n  createdAt\n}";

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
  "query Search($q: String!, $types: [SearchType!]) {\n  search(q: $q, types: $types) {\n    __typename\n    ... on Boss {\n      id\n      name\n    }\n    ... on Location {\n      id\n      name\n    }\n  }\n}";

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
  Locations: undefined;
  Reviews: undefined;
  NewReviews: VNewReviews;
  Search: VSearch;
}

export interface OperationNameToData {
  Bosses: DBosses;
  CompareBossDifficulty: DCompareBossDifficulty;
  CreateBossReview: DCreateBossReview;
  CreateLocationReview: DCreateLocationReview;
  Locations: DLocations;
  Reviews: DReviews;
  NewReviews: DNewReviews;
  Search: DSearch;
}

export type OperationName = QueryName | MutationName | SubscriptionName;

export type QueryName =
  | "Bosses"
  | "CompareBossDifficulty"
  | "Locations"
  | "Reviews"
  | "Search";

export type MutationName = "CreateBossReview" | "CreateLocationReview";

export type SubscriptionName = "NewReviews";
