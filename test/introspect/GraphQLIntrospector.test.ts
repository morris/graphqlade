import got from "got";
import nodeFetch from "node-fetch";
import { GraphQLIntrospector } from "../../src";
import { requireExampleServer } from "../util";

describe("The GraphQLIntrospector", () => {
  requireExampleServer();

  // TODO remove this test in 2.0
  it("DEPRECATED should be able to build a client schema from an introspection result", async () => {
    const introspector = new GraphQLIntrospector({
      request: (options) =>
        got({
          ...options,
          headers: {
            ...options.headers,
            "User-Agent": "test",
          },
        }),
    });

    const schema = await introspector.buildClientSchemaFromIntrospection(
      "http://localhost:4999/graphql",
      { authorization: "Bearer of a ring" }
    );

    expect(schema.getType("Boss")).toBeDefined();
  });

  it("should be able to build a client schema from an introspection result (using node-fetch)", async () => {
    const introspector = new GraphQLIntrospector({
      fetch: nodeFetch as unknown as typeof fetch,
    });

    const schema = await introspector.buildClientSchemaFromIntrospection(
      "http://localhost:4999/graphql",
      { authorization: "Bearer of a ring" }
    );

    expect(schema.getType("Boss")).toBeDefined();
  });
});
