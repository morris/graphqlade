/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require("assert");
const fs = require("fs");

describe("The UMD build", () => {
  it("should work with require()", () => {
    const graphqlade = require("../dist/graphqlade.umd.js");

    assert.strictEqual(typeof graphqlade.GraphQLClientWebSocket, "function");
    assert.strictEqual(typeof graphqlade.GraphQLWebSocketClient, "function");
  });

  it("should work with dynamic import", async () => {
    // TODO can we do better regarding this .default?
    const graphqlade = (await import("../dist/graphqlade.umd.js")).default;

    assert.strictEqual(typeof graphqlade.GraphQLClientWebSocket, "function");
    assert.strictEqual(typeof graphqlade.GraphQLWebSocketClient, "function");
  });

  it("should work as a global script (global self)", async () => {
    const self = {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const exports = undefined;

    eval(
      await fs.promises.readFile(
        `${__dirname}/../dist/graphqlade.umd.js`,
        "utf-8"
      )
    );

    const { graphqlade } = self;

    assert.strictEqual(typeof graphqlade.GraphQLClientWebSocket, "function");
    assert.strictEqual(typeof graphqlade.GraphQLWebSocketClient, "function");
  });
});
