import got from "got";
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

    expect(logger.errors.length).toEqual(0);
  });

  it("should generate client-code for the example client", async () => {
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

    expect(logger.errors.length).toEqual(0);
  });
});
