import { Resolvers } from "../generated/schema";
import { MyContext } from "../MyContext";
import { mutationResolvers } from "./Mutation";
import { queryResolvers } from "./Query";
import { reviewResolvers } from "./reviewResolvers";
import { scalarResolvers } from "./scalarResolvers";

export const resolvers: Resolvers<MyContext>[] = [
  queryResolvers,
  mutationResolvers,
  scalarResolvers,
  reviewResolvers,
];
