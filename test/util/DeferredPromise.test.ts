import * as assert from "assert";
import { DeferredPromise } from "../../src";

describe("A DeferredPromise", () => {
  it("should be resolvable externally immediately", async () => {
    const deferred = new DeferredPromise<string>();

    deferred.resolve("test");

    assert.strictEqual(await deferred, "test");
  });

  it("should be resolvable externally later", async () => {
    const deferred = new DeferredPromise<string>();

    setTimeout(() => deferred.resolve("test"), 100);

    assert.strictEqual(await deferred, "test");
  });
});
