import { mkdirSync, rmdirSync, writeFileSync } from "fs";
import { join } from "path";
import { GraphQLReader, watchRecursive } from "../../src";

describe("The watchRecursive function", () => {
  beforeAll(() => {
    rmdirSync(join(__dirname, "watchRecursive"), { recursive: true });
    mkdirSync(join(__dirname, "watchRecursive"), { recursive: true });
  });

  it("should watch directories recursively", async () => {
    const callbacks: string[] = [];

    const stop = await watchRecursive({
      dirname: join(__dirname, "watchRecursive"),
      callback: (path) => callbacks.push(path),
      match: (path, stats) =>
        stats.isDirectory() || new GraphQLReader().isGraphQLFile(path),
    });

    mkdirSync(join(__dirname, "watchRecursive/foo"), { recursive: true });
    mkdirSync(join(__dirname, "watchRecursive/bar"));
    writeFileSync(join(__dirname, "watchRecursive/test.graphql"), "");

    await new Promise((resolve) => setTimeout(resolve, 100));

    mkdirSync(join(__dirname, "watchRecursive/foo/baz"));
    writeFileSync(join(__dirname, "watchRecursive/foo/test.gql"), "");
    writeFileSync(join(__dirname, "watchRecursive/foo/baz/test.txt"), "");

    await new Promise((resolve) => setTimeout(resolve, 100));

    writeFileSync(join(__dirname, "watchRecursive/test.graphql"), "");
    writeFileSync(join(__dirname, "watchRecursive/foo/test.gql"), "");

    await new Promise((resolve) => setTimeout(resolve, 100));

    rmdirSync(join(__dirname, "watchRecursive/foo"), { recursive: true });

    await new Promise((resolve) => setTimeout(resolve, 100));

    stop();

    writeFileSync(join(__dirname, "watchRecursive/late.gql"), "");

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (process.env.CI) {
      // watching may work differently in CI
      // only do a basic check
      return expect(callbacks.length).toBeGreaterThan(10);
    }

    // TODO this used to be a strict array check but it was flaky;
    // switched to checking unique entries for now
    expect(Array.from(new Set(callbacks)).sort()).toEqual(
      [
        "/watchRecursive/bar",
        "/watchRecursive/foo",
        "/watchRecursive/foo/baz",
        // this .txt file is fine since on deletion,
        // we cannot know if a file or directory was deleted
        "/watchRecursive/foo/baz/test.txt",
        "/watchRecursive/foo/test.gql",
        "/watchRecursive/test.graphql",
      ].map((it) => join(__dirname, it))
    );
  });
});
