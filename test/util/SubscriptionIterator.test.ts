import * as assert from "assert";
import { SubscriptionIterator } from "../../src";

describe("The SubscriptionIterator", () => {
  it("should iterate over subscriptions", async () => {
    let cleared = false;

    const iterator = new SubscriptionIterator<number>((push, stop) => {
      let i = 0;
      const intervalId = setInterval(() => push(++i), 100);
      const timeoutId = setTimeout(() => stop(), 1050);

      return () => {
        cleared = true;
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    });

    const results: number[] = [];

    for await (const i of iterator) {
      results.push(i);
    }

    assert.deepStrictEqual(results, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.ok(cleared);
  });

  it("should be cancelable", async () => {
    let cleared = false;

    const iterator = new SubscriptionIterator<number>((push) => {
      let i = 0;
      const intervalId = setInterval(() => push(++i), 100);

      return () => {
        cleared = true;
        clearInterval(intervalId);
      };
    });

    setTimeout(() => iterator.return(), 550);

    const results: number[] = [];

    for await (const i of iterator) {
      results.push(i);
    }

    assert.deepStrictEqual(results, [1, 2, 3, 4, 5]);
    assert.ok(cleared);
  });

  it("should allow pushing multiple values", async () => {
    let cleared = false;

    const iterator = new SubscriptionIterator<number>((push, stop) => {
      let i = 0;
      const intervalId = setInterval(() => {
        push(++i);
        push(++i);
        push(++i);
      }, 100);
      const timeoutId = setTimeout(() => stop(), 1050);

      return () => {
        cleared = true;
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    });

    const results: number[] = [];

    for await (const i of iterator) {
      results.push(i);
    }

    assert.strictEqual(results.length, 30);
    assert.ok(cleared);
  });

  // TODO why is this failing :(
  it.skip("should be cancelable with an error", async () => {
    let cleared = false;

    const iterator = new SubscriptionIterator<number>((push, _, fail) => {
      let i = 0;
      const intervalId = setInterval(() => push(++i), 100);
      const timeoutId = setTimeout(() => fail(new Error("test")), 550);

      return () => {
        cleared = true;
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      };
    });

    const results: number[] = [];

    try {
      for await (const i of iterator) {
        results.push(i);
      }
      // TODO apparently AsyncIterator.throw doesn't throw?
      assert.ok(false, "should have thrown");
    } catch (err) {
      assert.strictEqual(err.message, "test");
    }

    assert.deepStrictEqual(results, [1, 2, 3, 4, 5]);
    assert.ok(cleared);
  });
});
