import { Resolvers } from '../generated/schema';
import { MyContext } from '../MyContext';
import { LocationData } from '../types';

export const queryResolvers: Resolvers<MyContext> = {
  Query: {
    praise() {
      return 'the sun!';
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
    search(_, args, context) {
      if (args.types) throw new Error('Not implemented');

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
  },

  Location: {
    bosses(data, _, context) {
      return context.getBossesByLocationId(data.id);
    },
  },

  SearchResult: {
    __resolveType(data) {
      return data.id < 10 ? 'Boss' : 'Location';
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
