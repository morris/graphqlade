import { GraphQLIntrospector } from "../../src";
import { requireExampleServer } from "../util";

describe("The GraphQLIntrospector", () => {
  requireExampleServer();

  it("should be able to build a client schema from an introspection result (using node-fetch)", async () => {
    const introspector = new GraphQLIntrospector();

    const schema = await introspector.buildClientSchemaFromIntrospection(
      "http://localhost:4999/graphql",
      { authorization: "Bearer of a ring" }
    );

    expect(schema.getType("Boss")).toBeDefined();
  });
});
