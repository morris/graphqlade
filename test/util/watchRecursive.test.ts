import * as assert from "assert";
import { join } from "path";
import { mkdirSync, writeFileSync, rmdirSync } from "fs";
import { GraphQLReader, watchRecursive } from "../../src";

describe("The watchRecursive function", () => {
  before(() => {
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

    assert.deepStrictEqual(
      callbacks.sort(),
      [
        "/watchRecursive/bar", // created
        "/watchRecursive/foo", // created
        "/watchRecursive/foo", // deleted
        "/watchRecursive/foo", // deleted at parent
        "/watchRecursive/foo/baz", // created
        // this .txt file is fine since on deletion,
        // we cannot know if a file or directory was deleted
        "/watchRecursive/foo/baz/test.txt", // deleted at parent
        "/watchRecursive/foo/test.gql", // created
        "/watchRecursive/foo/test.gql", // touched
        "/watchRecursive/foo/test.gql", // deleted at parent
        "/watchRecursive/test.graphql", // created
        "/watchRecursive/test.graphql", // touched
        // TODO this could be a (non-critical) bug. extraneous watcher?
        "/watchRecursive/test.graphql", // ?
      ].map((it) => join(__dirname, it))
    );
  });
});
