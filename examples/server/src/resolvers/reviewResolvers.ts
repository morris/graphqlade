import { AsyncPushIterator } from '../../../../src';
import { Resolvers } from '../generated/schema';
import { MyContext } from '../MyContext';
import { BossData, LocationData } from '../types';

export const reviewResolvers: Resolvers<MyContext> = {
  Query: {
    reviews(_, __, context) {
      return context.getReviews();
    },
  },
  Mutation: {
    createBossReview(_, args, context) {
      return context.saveReview({
        subjectId: parseInt(args.input.bossId, 10),
        subjectType: 1,
        author: args.input.author,
        difficulty: args.input.difficulty.toLowerCase(),
        theme: args.input.theme,
      });
    },
    createLocationReview(_, args, context) {
      return context.saveReview({
        subjectId: parseInt(args.input.locationId, 10),
        subjectType: 2,
        author: args.input.author,
        difficulty: args.input.difficulty.toLowerCase(),
        design: args.input.design,
      });
    },
  },
  Boss: {
    reviews(data, _, context) {
      return context.getReviewsBySubjectId(data.id);
    },
  },

  Location: {
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
      return context.getLocationById(data.subjectId) as LocationData;
    },
    difficulty(data) {
      return data.difficulty.toUpperCase();
    },
  },

  Subscription: {
    async newReview(_, args, context) {
      return new AsyncPushIterator((it) => {
        let i = 0;

        return context.subscribeReviews((review) => {
          it.push({ newReview: review });

          if (args.limit && ++i >= args.limit) it.finish();
        });
      });
    },
  },
};
