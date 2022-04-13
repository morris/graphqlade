import { execute, GraphQLEnumType, parse } from "graphql";
import { GraphQLDateTime } from "graphql-scalars";
import { GraphQLServer } from "../../src";

describe("The GraphQLServer", () => {
  it("should be able to bootstrap an executable schema", async () => {
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root: `${__dirname}/../../examples/server`,
      createContext() {
        return undefined;
      },
    });

    gqlServer.setResolvers({
      Query: {
        praise() {
          return "the sun!";
        },
      },
    });

    const result = execute({
      schema: gqlServer.schema,
      document: parse(`
        { praise }
      `),
    });

    expect(result).toEqual({
      data: {
        praise: "the sun!",
      },
    });
  });

  it("should add enum and scalar resolvers correctly", async () => {
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root: `${__dirname}/../../examples/server`,
      createContext() {
        return undefined;
      },
    });

    gqlServer.setResolvers({
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
          return 1000;
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
    });

    const enumType = gqlServer.schema.getType("Rating") as GraphQLEnumType;

    expect(enumType.parseValue("TERRIBLE")).toEqual(1);
    expect(enumType.serialize(1)).toEqual("TERRIBLE");

    const result = execute({
      schema: gqlServer.schema,
      document: parse(`
        { reviews { createdAt ... on BossReview { theme } } }
      `),
    });

    expect(result).toEqual({
      data: {
        reviews: [
          {
            createdAt: new Date("1970-01-01T00:00:01.000Z"),
            theme: "TERRIBLE",
          },
        ],
      },
    });
  });
});
