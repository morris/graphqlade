import { GraphQLSchema } from "graphql";
import { resolvers } from "../../examples/server/src/resolvers";
import { buildExecutableSchema, GraphQLHttpServer } from "../../src";

describe("The example server", () => {
  let schema: GraphQLSchema;
  let gqlHttpServer: GraphQLHttpServer<undefined>;

  beforeAll(async () => {
    schema = await buildExecutableSchema({
      root: `${__dirname}/../../examples/server`,
      resolvers,
    });

    gqlHttpServer = new GraphQLHttpServer({
      schema,
      createContext() {
        return undefined;
      },
    });
  });

  it("should support custom scalar parsing and serialization", async () => {
    const response = await gqlHttpServer.execute(
      {
        method: "POST",
        headers: {},
        body: {
          query: `{
            zero: isFinite(input: 0) { input result }
            one: isFinite(input: 1.0) { input result }
            minusOne: isFinite(input: -1) { input result }
            infinity: isFinite(input: "Infinity") { input result }
            negativeInfinity: isFinite(input: "-Infinity") { input result }
            nan: isFinite(input: "NaN") { input result }
          }`,
        },
      },
      undefined
    );

    expect(response).toEqual({
      status: 200,
      headers: {},
      body: {
        data: {
          zero: { input: 0, result: true },
          one: { input: 1, result: true },
          minusOne: { input: -1, result: true },
          infinity: { input: "Infinity", result: false },
          negativeInfinity: { input: "-Infinity", result: false },
          nan: { input: "NaN", result: false },
        },
      },
    });
  });

  it("should support custom scalar parsing and serialization (2)", async () => {
    const response = await gqlHttpServer.execute(
      {
        method: "POST",
        headers: {},
        body: {
          query: `{
            infinity: divide(dividend: 1 divisor: 0)
            negativeInfinity: divide(dividend: -1 divisor: 0)
          }`,
        },
      },
      undefined
    );

    expect(response).toEqual({
      status: 200,
      headers: {},
      body: {
        data: {
          infinity: "Infinity",
          negativeInfinity: "-Infinity",
        },
      },
    });
  });
});
