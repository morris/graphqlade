import * as assert from "assert";
import got from "got";
import { GraphQLIntrospector } from "../../src";
import { requireExampleServer } from "../util";

describe("The GraphQLIntrospector", () => {
  requireExampleServer();

  it("should be able to build a client schema from an introspection result", async () => {
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
      { Authorization: "Bearer of a ring" }
    );

    assert.ok(schema.getType("Boss"));
  });
});
