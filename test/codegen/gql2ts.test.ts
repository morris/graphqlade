import got from "got";
import nodeFetch from "node-fetch";
import { gql2ts } from "../../src";
import { requireExampleServer, TestLogger } from "../util";

describe("The gql2ts function", () => {
  requireExampleServer();

  it("should generate server-side code for the example server", async () => {
    const logger = new TestLogger();

    await gql2ts({
      root: "examples/server",
      server: true,
      noExit: true,
      logger,
    });

    expect(logger.errors).toEqual([]);
  });

  // TODO remove in 2.0
  it("DEPRECATED should generate client-code for the example client", async () => {
    const logger = new TestLogger();

    await gql2ts({
      root: "examples/client",
      introspection: {
        url: "http://localhost:4999/graphql",
        request: got,
      },
      client: true,
      noExit: true,
      logger,
    });

    expect(logger.errors).toEqual([]);
  });

  it("should generate client-code for the example client (using node-fetch)", async () => {
    const logger = new TestLogger();

    await gql2ts({
      root: "examples/client",
      introspection: {
        url: "http://localhost:4999/graphql",
        fetch: nodeFetch as unknown as typeof fetch,
        async getHeaders() {
          logger.log("got headers");

          return { "x-test": "lol" };
        },
      },
      client: true,
      noExit: true,
      logger,
    });

    expect(logger.errors).toEqual([]);
    expect(logger.logs).toEqual(["got headers"]);
  });
});
