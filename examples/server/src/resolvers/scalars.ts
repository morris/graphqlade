import { GraphQLDate, GraphQLDateTime, GraphQLTime } from "graphql-iso-date";
import { MyContext } from "../context";
import { ResolverMap } from "../generated/schema";

export const scalarResolvers: ResolverMap<MyContext> = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
};
