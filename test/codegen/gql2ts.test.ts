import * as fs from "fs";
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

  it("should generate server-side code with stitching directives", async () => {
    const logger = new TestLogger();

    await gql2ts({
      root: "examples/server",
      server: true,
      noExit: true,
      stitching: true,
      logger,
    });

    expect(logger.errors).toEqual([]);
  });

  it("should write an introspection fallback file if the file option is set", async () => {
    const logger = new TestLogger();
    const file = "test/codegen/introspection.json";

    await fs.promises.rm(file).catch(() => 0);

    await gql2ts({
      root: "examples/client",
      introspection: {
        url: "http://localhost:4999/graphql",
        file,
      },
      client: true,
      noExit: true,
      logger,
    });

    await fs.promises.readFile(file, "utf-8");

    await gql2ts({
      root: "examples/client",
      introspection: {
        url: "http://localhost:4999/use/fallback/instead",
        file,
      },
      client: true,
      noExit: true,
      logger,
    });

    expect(logger.errors).toEqual([]);
  });
});
