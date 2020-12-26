import { MyContext } from "../context";
import { ResolverMap } from "../generated/schema";
import { mutationResolvers } from "./Mutation";
import { queryResolvers } from "./Query";
import { scalarResolvers } from "./scalars";

export const resolvers: ResolverMap<MyContext> = {
  ...queryResolvers,
  ...mutationResolvers,
  ...scalarResolvers,
};
