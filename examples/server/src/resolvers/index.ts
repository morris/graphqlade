import { MyContext } from "../context";
import { ResolverMap } from "../generated/schema";
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
