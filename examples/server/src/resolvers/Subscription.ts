import { MyContext } from "../context";
import { SSubscription } from "../generated/schema";
import { SubscriptionIterator } from "../../../../src";

export const Subscription: SSubscription<MyContext> = {
  async newReviews(_, args, context) {
    return new SubscriptionIterator((push, stop) => {
      let i = 0;

      return context.subscribeReviews((review) => {
        push({ newReviews: review });

        if (args.limit && ++i >= args.limit) return stop();
      });
    });
  },
};
