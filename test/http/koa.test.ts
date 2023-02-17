import KoaRouter from "@koa/router";
import { Server } from "http";
import Koa from "koa";
import KoaBodyParser from "koa-bodyparser";
import { MyContext } from "../../examples/server/src/MyContext";
import { GraphQLServer } from "../../src";
import { bootstrapExample } from "../util";

describe("The GraphQLHttpServer exposed via Koa", () => {
  const url = "http://localhost:5999/graphql";
  const router = new KoaRouter();

  let gqlServer: GraphQLServer<MyContext>;
  let app: Koa;
  let server: Server;

  beforeAll(async () => {
    gqlServer = await bootstrapExample();

    app = new Koa();

    router.get("/graphql", gqlServer.http.koaHandler());
    router.post("/graphql", KoaBodyParser(), gqlServer.http.koaHandler());

    app.use(router.allowedMethods()).use(router.routes());

    server = app.listen(5999);
  });

  afterAll(() => {
    if (server) server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be able to handle POST GraphQL requests", async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: "{ praise }",
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );

    const json = await response.json();

    expect(json).toEqual({
      data: {
        praise: "the sun!",
      },
    });
  });

  it("should be able to handle GET GraphQL requests", async () => {
    const response = await fetch(`${url}?query={praise}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );

    const json = await response.json();

    expect(json).toEqual({
      data: {
        praise: "the sun!",
      },
    });
  });

  it("should reject unsupported methods", async () => {
    const response = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `{ praise }`,
        operationName: "String",
      }),
    });

    expect(response.status).toBe(405);

    const text = await response.text();

    expect(text).toEqual("Method Not Allowed");
  });

  it("should reject mutations via GET", async () => {
    const response = await fetch(`${url}?query=mutation{youDied}`);

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );

    const json = await response.json();

    expect(json).toEqual({
      errors: [{ message: "Mutations are not allowed via GET" }],
    });
  });

  it("should reject invalid queries", async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `{ invalid }`,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );

    const json = await response.json();

    expect(json).toEqual({
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
    });
  });

  it("should reject bad requests (e.g. no content-type) with status code 400", async () => {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        query: `{ invalid }`,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8"
    );

    const json = await response.json();

    expect(json).toEqual({
      errors: [{ message: "Invalid query, expected string" }],
    });
  });

  it("should respect koa middleware queued in after the graphql handler", async () => {
    const postGraphqlHandlerMiddleware = jest.fn();

    const appWithAdditionalMiddleware: Koa = new Koa();
    appWithAdditionalMiddleware
      .use(router.allowedMethods())
      .use(router.routes());
    appWithAdditionalMiddleware.use(postGraphqlHandlerMiddleware);
    const anotherServer = appWithAdditionalMiddleware.listen(6001);

    try {
      const response = await fetch(
        `http://localhost:6001/graphql?query={praise}`
      );
      expect(response.status).toBe(200);
      expect(postGraphqlHandlerMiddleware).toBeCalledTimes(1);
    } finally {
      anotherServer.close();
    }
  });
});
