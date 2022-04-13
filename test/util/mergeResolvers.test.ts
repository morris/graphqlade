import { GraphQLDateTime } from "graphql-scalars";
import { Resolvers } from "../../examples/server/src/generated/schema";
import { mergeResolvers } from "../../src";

describe("The mergeResolvers function", () => {
  it("should merge resolvers", () => {
    const a: Resolvers<undefined> = {
      Query: {
        boss() {
          return { id: 11, name: "a", locationId: 21, required: true };
        },
        praise() {
          return "???";
        },
      },
      Rating: {
        ALRIGHT: 1,
        AMAZING: 2,
        STELLAR: 3,
        MEH: 5,
        TERRIBLE: 6,
      },
      DateTime: GraphQLDateTime,
    };

    const b: Resolvers<undefined> = {
      Query: {
        location() {
          return { id: 21, name: "x" };
        },
        praise() {
          return "sun";
        },
      },
    };

    expect(mergeResolvers([a, b])).toEqual({
      Query: {
        boss: a.Query?.boss,
        location: b.Query?.location,
        praise: b.Query?.praise,
      },
      Rating: a.Rating,
      DateTime: GraphQLDateTime,
    });
  });
});
