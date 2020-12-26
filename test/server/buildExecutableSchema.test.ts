import * as assert from "assert";
import { execute, GraphQLEnumType, parse } from "graphql";
import { buildExecutableSchema } from "../../src";
import { cleanJson } from "../util";
import { GraphQLDateTime } from "graphql-iso-date";

describe("The buildExecutableSchema function", () => {
  it("should build an executable schema", async () => {
    const schema = await buildExecutableSchema({
      root: `${__dirname}/../../examples/server`,
      resolvers: {
        Query: {
          praise() {
            return "the sun!";
          },
        },
      },
    });

    const result = execute(
      schema,
      parse(`
        { praise }
      `)
    );

    assert.deepStrictEqual(cleanJson(result), {
      data: {
        praise: "the sun!",
      },
    });
  });

  it("should add enum and scalar resolvers correctly", async () => {
    const schema = await buildExecutableSchema({
      root: `${__dirname}/../../examples/server`,
      resolvers: {
        Query: {
          reviews() {
            return [{ theme: 1 }];
          },
        },
        Review: {
          __resolveType() {
            return "BossReview";
          },
          createdAt() {
            return 1;
          },
        },
        BossReview: {
          theme(data: { theme: number }) {
            return data.theme;
          },
        },
        Rating: {
          TERRIBLE: 1,
          MEH: 2,
          ALRIGHT: 3,
          AMAZING: 4,
          STELLAR: 5,
        },
        DateTime: GraphQLDateTime,
      },
    });

    const enumType = schema.getType("Rating") as GraphQLEnumType;

    assert.strictEqual(enumType.parseValue("TERRIBLE"), 1);
    assert.strictEqual(enumType.serialize(1), "TERRIBLE");

    const result = execute(
      schema,
      parse(`
        { reviews { createdAt ... on BossReview { theme } } }
      `)
    );

    assert.deepStrictEqual(cleanJson(result), {
      data: {
        reviews: [
          {
            createdAt: "1970-01-01T00:00:01.000Z",
            theme: "TERRIBLE",
          },
        ],
      },
    });
  });
});
