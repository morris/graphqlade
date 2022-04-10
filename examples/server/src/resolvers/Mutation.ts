import { ResolverMap } from "../generated/schema";
import { MyContext } from "../MyContext";

export const mutationResolvers: ResolverMap<MyContext> = {
  Mutation: {
    youDied() {
      return true;
    },
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
};
