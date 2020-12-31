import { MyContext } from "../context";
import { SSubscription } from "../generated/schema";
import { AsyncPushIterator } from "../../../../src";

export const Subscription: SSubscription<MyContext> = {
  async newReviews(_, args, context) {
    return new AsyncPushIterator((it) => {
      let i = 0;

      return context.subscribeReviews((review) => {
        it.push({ newReviews: review });

        if (args.limit && ++i >= args.limit) it.finish();
      });
    });
  },
};
