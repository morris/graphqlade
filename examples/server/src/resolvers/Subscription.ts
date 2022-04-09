import { AsyncPushIterator } from "../../../../src";
import { MyContext } from "../context";
import { ResolverMap } from "../generated/schema";

export const subscriptionResolvers: ResolverMap<MyContext> = {
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
