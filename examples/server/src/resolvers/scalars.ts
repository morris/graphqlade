import { GraphQLScalarType } from "graphql";
import { GraphQLDate, GraphQLDateTime, GraphQLTime } from "graphql-iso-date";
import { MyContext } from "../context";
import { ResolverMap } from "../generated/schema";

export const scalarResolvers: ResolverMap<MyContext> = {
  Date: GraphQLDate,
  Time: GraphQLTime,
  DateTime: GraphQLDateTime,
  ESNumber: new GraphQLScalarType({
    name: "ESNumber",
    serialize(value) {
      if (value === Number.NEGATIVE_INFINITY) return "-Infinity";
      if (isNaN(value)) return "NaN";
      if (!isFinite(value)) return "Infinity";

      return parseFloat(value);
    },
    parseValue(value) {
      switch (value) {
        case "Infinity":
          return Infinity;
        case "-Infinity":
          return -Infinity;
        case "NaN":
          return NaN;
        default:
          return parseFloat(value);
      }
    },
  }),
};
