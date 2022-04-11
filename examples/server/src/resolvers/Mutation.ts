import { ResolverMap } from "../generated/schema";
import { MyContext } from "../MyContext";

export const mutationResolvers: ResolverMap<MyContext> = {
  Mutation: {
    youDied() {
      return true;
    },
  },
};
