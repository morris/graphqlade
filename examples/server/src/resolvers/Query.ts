import { ResolverMap } from "../generated/schema";
import { MyContext } from "../MyContext";
import { BossData, LocationData } from "../types";

export const queryResolvers: ResolverMap<MyContext> = {
  Query: {
    praise() {
      return "the sun!";
    },
    bosses(_, __, context) {
      return context.getBosses();
    },
    boss(_, args, context) {
      return context.getBossById(parseInt(args.id));
    },
    locations(_, __, context) {
      return context.getLocations();
    },
    location(_, args, context) {
      return context.getLocationById(parseInt(args.id));
    },
    reviews(_, __, context) {
      return context.getReviews();
    },
    search(_, args, context) {
      if (args.types) throw new Error("Not implemented");

      return context.search(args.q);
    },
    isFinite(_, args) {
      return {
        input: args.input,
        result: isFinite(args.input),
      };
    },
    divide(_, args) {
      return args.dividend / args.divisor;
    },
  },

  Boss: {
    optional(data) {
      return !data.required;
    },
    location(data, _, context) {
      // note how typescript forces us to cast here.
      // we know that bosses have a valid location;
      // typescript thinks we might return undefined,
      // hence the cast
      return context.getLocationById(data.locationId) as LocationData;
    },
    reviews(data, _, context) {
      return context.getReviewsBySubjectId(data.id);
    },
  },

  Location: {
    bosses(data, _, context) {
      return context.getBossesByLocationId(data.id);
    },
    reviews(data, _, context) {
      return context.getReviewsBySubjectId(data.id);
    },
  },

  Review: {
    createdAt(data) {
      return data.time;
    },
  },

  BossReview: {
    __isTypeOf(data) {
      return data.subjectType === 1;
    },
    boss(data, __, context) {
      return context.getBossById(data.subjectId) as BossData;
    },
    difficulty(data) {
      return data.difficulty.toUpperCase();
    },
    theme(data) {
      return data.theme as number;
    },
  },

  LocationReview: {
    __isTypeOf(data) {
      return data.subjectType === 2;
    },
    location(data, __, context) {
      return context.getLocationById(data.subjectId) as BossData;
    },
    difficulty(data) {
      return data.difficulty.toUpperCase();
    },
  },

  SearchResult: {
    __resolveType(data) {
      return data.id < 10 ? "Boss" : "Location";
    },
  },

  Rating: {
    TERRIBLE: 1,
    MEH: 2,
    ALRIGHT: 3,
    AMAZING: 4,
    STELLAR: 5,
  },
};
