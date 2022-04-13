import { GraphQLError } from "graphql";
import { MyContext } from "../../examples/server/src/MyContext";
import { GraphQLServer } from "../../src";
import { bootstrapExample } from "../util";

describe("The GraphQLHttpServer", () => {
  let gqlServer: GraphQLServer<MyContext>;

  beforeAll(async () => {
    gqlServer = await bootstrapExample();
  });

  it("should be able to handle POST GraphQL requests", async () => {
    const response = await gqlServer.http.execute(
      {
        method: "POST",
        headers: {},
        body: {
          query: "{ praise }",
        },
      },
      undefined
    );

    expect(response).toEqual({
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
    const response = await gqlServer.http.execute(
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
    await gqlServer.http.execute(
      {
        method: "GET",
        headers: {},
        query: {
          query: `{ praise }`,
        },
      },
      undefined
    );

    expect(response).toEqual({
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
    const response = await gqlServer.http.execute(
      {
        method: "PUT",
        headers: {},
        body: {
          query: `{ praise }`,
          operationName: "String",
        },
      },
      undefined
    );

    expect(response).toEqual({
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
    const response = await gqlServer.http.execute(
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

    expect(response).toEqual({
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
    const response = await gqlServer.http.execute(
      {
        method: "POST",
        headers: {},
        body: {
          query: `{ invalid }`,
        },
      },
      undefined
    );

    expect(response).toEqual({
      status: 400,
      headers: {},
      body: {
        errors: [
          new GraphQLError('Cannot query field "invalid" on type "Query".', {}),
        ],
      },
    });
  });
});
