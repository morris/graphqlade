import * as assert from "assert";
import { GraphQLSchema } from "graphql";
import { buildExecutableSchema, GraphQLServer } from "../../src";
import { cleanJson } from "../util";
import { resolvers } from "../../examples/server/src/resolvers";

describe("The GraphQLServer class", () => {
  let schema: GraphQLSchema;
  let operations: string;

  before(async () => {
    schema = await buildExecutableSchema({
      root: `${__dirname}/../../examples/server`,
      resolvers,
    });
  });

  it("should be able to handle POST GraphQL requests", async () => {
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
      {
        method: "POST",
        headers: {},
        body: {
          query: "{ praise }",
        },
      },
      undefined
    );

    assert.deepStrictEqual(cleanJson(response), {
      status: 200,
      headers: {},
      body: {
        data: {
          praise: "the sun!",
        },
      },
    });
  });

  it("should be able to handle GET GraphQL requests", async () => {
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
      {
        method: "GET",
        headers: {},
        query: {
          query: `{ praise }`,
        },
      },
      undefined
    );

    // test query caching
    await gqlServer.execute(
      {
        method: "GET",
        headers: {},
        query: {
          query: `{ praise }`,
        },
      },
      undefined
    );

    assert.deepStrictEqual(cleanJson(response), {
      status: 200,
      headers: {},
      body: {
        data: {
          praise: "the sun!",
        },
      },
    });
  });

  it("should reject unsupported methods", async () => {
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
      {
        method: "PUT",
        headers: {},
        body: {
          query: operations,
          operationName: "String",
        },
      },
      undefined
    );

    assert.deepStrictEqual(cleanJson(response), {
      status: 405,
      headers: {},
      body: {
        errors: [
          {
            message: "Unsupported method: PUT",
          },
        ],
      },
    });
  });

  it("should reject mutations via GET", async () => {
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
      {
        method: "GET",
        headers: {},
        query: {
          query: "mutation Test { youDied }",
          operationName: "Test",
        },
      },
      undefined
    );

    assert.deepStrictEqual(cleanJson(response), {
      status: 400,
      headers: {},
      body: {
        errors: [
          {
            message: "Mutations are not allowed via GET",
          },
        ],
      },
    });
  });

  it("should reject invalid queries", async () => {
    const gqlServer = new GraphQLServer<undefined>({ schema });

    const response = await gqlServer.execute(
      {
        method: "POST",
        headers: {},
        body: {
          query: `{ invalid }`,
        },
      },
      undefined
    );

    assert.deepStrictEqual(cleanJson(response), {
      status: 400,
      headers: {},
      body: {
        errors: [
          {
            locations: [
              {
                column: 3,
                line: 1,
              },
            ],
            message: 'Cannot query field "invalid" on type "Query".',
          },
        ],
      },
    });
  });
});
