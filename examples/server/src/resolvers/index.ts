import { ResolverMap } from "../generated/schema";
import { MyContext } from "../MyContext";
import { mutationResolvers } from "./Mutation";
import { queryResolvers } from "./Query";
import { scalarResolvers } from "./scalars";
import { subscriptionResolvers } from "./Subscription";

export const resolvers: ResolverMap<MyContext> = {
  ...queryResolvers,
  ...mutationResolvers,
  ...scalarResolvers,
  ...subscriptionResolvers,
};
