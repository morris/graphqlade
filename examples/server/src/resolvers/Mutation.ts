import { Resolvers } from "../generated/schema";
import { MyContext } from "../MyContext";

export const mutationResolvers: Resolvers<MyContext> = {
  Mutation: {
    youDied() {
      return true;
    },
  },
};
