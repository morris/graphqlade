import * as assert from "assert";
import { GraphQLSchema } from "graphql";
import { buildExecutableSchema, GraphQLServer } from "../../src";
import { cleanJson } from "../util";
import { resolvers } from "../../examples/server/src/resolvers";

describe("The example server", () => {
  let schema: GraphQLSchema;

  before(async () => {
    schema = await buildExecutableSchema({
      root: `${__dirname}/../../examples/server`,
      resolvers,
    });
  });

  it("should support custom scalar parsing and serialization", async () => {
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
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

    assert.deepStrictEqual(cleanJson(response), {
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
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
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

    assert.deepStrictEqual(cleanJson(response), {
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
