import KoaRouter from "@koa/router";
import got from "got";
import { GraphQLSchema } from "graphql";
import { IncomingHttpHeaders, Server } from "http";
import Koa from "koa";
import KoaBodyParser from "koa-bodyparser";
import { resolvers } from "../../examples/server/src/resolvers";
import { buildExecutableSchema, GraphQLHttpServer } from "../../src";

describe("The GraphQLHttpServer exposed via Koa", () => {
  let schema: GraphQLSchema;
  let gqlHttpServer: GraphQLHttpServer<IncomingHttpHeaders>;
  let app: Koa;
  let server: Server;

  beforeAll(async () => {
    schema = await buildExecutableSchema({
      root: `${__dirname}/../../examples/server`,
      resolvers,
    });

    gqlHttpServer = new GraphQLHttpServer({
      schema,
      createContext({ headers }) {
        expect(headers?.["user-agent"]).toMatch(/got/);
        return headers ?? {};
      },
    });

    app = new Koa();

    const router = new KoaRouter();

    router.get("/graphql", gqlHttpServer.koaHandler());
    router.post("/graphql", KoaBodyParser(), gqlHttpServer.koaHandler());

    app.use(router.allowedMethods()).use(router.routes());

    server = app.listen(5999);
  });

  afterAll(() => {
    if (server) server.close();
  });

  it("should be able to handle POST GraphQL requests", async () => {
    const { statusCode, headers, body } = await got({
      method: "POST",
      url: "http://localhost:5999/graphql",
      headers: {},
      json: {
        query: "{ praise }",
      },
      responseType: "json",
    });

    expect({ statusCode, headers, body }).toMatchObject({
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: {
        data: {
          praise: "the sun!",
        },
      },
    });
  });

  it("should be able to handle GET GraphQL requests", async () => {
    const { statusCode, headers, body } = await got({
      method: "GET",
      url: "http://localhost:5999/graphql",
      headers: {},
      searchParams: {
        query: `{ praise }`,
      },
      responseType: "json",
    });

    expect({ statusCode, headers, body }).toMatchObject({
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: {
        data: {
          praise: "the sun!",
        },
      },
    });
  });

  it("should reject unsupported methods", async () => {
    const { statusCode, headers, body } = await got({
      method: "PUT",
      url: "http://localhost:5999/graphql",
      headers: {},
      json: {
        query: `{ praise }`,
        operationName: "String",
      },
      responseType: "json",
      throwHttpErrors: false,
    });

    expect({ statusCode, headers, body }).toMatchObject({
      statusCode: 405,
      headers: {},
      body: "Method Not Allowed",
    });
  });

  it("should reject mutations via GET", async () => {
    const { statusCode, headers, body } = await got({
      method: "GET",
      url: "http://localhost:5999/graphql",
      headers: {},
      searchParams: {
        query: "mutation Test { youDied }",
        operationName: "Test",
      },
      responseType: "json",
      throwHttpErrors: false,
    });

    expect({ statusCode, headers, body }).toMatchObject({
      statusCode: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
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
    const { statusCode, headers, body } = await got({
      method: "POST",
      url: "http://localhost:5999/graphql",
      headers: {},
      json: {
        query: `{ invalid }`,
      },
      responseType: "json",
      throwHttpErrors: false,
    });

    expect({ statusCode, headers, body }).toMatchObject({
      statusCode: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
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
