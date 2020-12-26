import * as assert from "assert";
import { GraphQLReader } from "../../src";

describe("The GraphQLReader", () => {
  it("should be able to build the example schema", async () => {
    const reader = new GraphQLReader();

    const schema = await reader.buildSchemaFromDir(
      `${__dirname}/../../examples/server/schema`
    );

    assert.ok(schema.getType("Query"));
  });

  it("should be able to parse the example operations", async () => {
    const reader = new GraphQLReader();

    const document = await reader.parseDir(
      `${__dirname}/../../examples/client/operations`
    );

    assert.ok(
      document.definitions.filter((it) => it.kind === "OperationDefinition")
        .length > 0
    );
  });

  it("should cache reads", async () => {
    const reader = new GraphQLReader();

    await reader.readDir(`${__dirname}/../../examples/server/schema`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reader as any).readFileFresh = () => {
      throw new Error("Uncached read detected");
    };

    await reader.readDir(`${__dirname}/../../examples/server/schema`);
  });

  it("should do parse checks and report errors with useful file locations", async () => {
    const reader = new GraphQLReader();

    try {
      await reader.readDir(`${__dirname}/../fixtures`);

      throw new Error("Did not parse check");
    } catch (err) {
      assert.ok(
        err.message.match(
          /^Syntax Error: Expected ":", found "\)"\. at .*invalid.gql:2:13$/
        ),
        err.message
      );
    }
  });

  it("should allow disabling parse checks", async () => {
    const reader = new GraphQLReader({ disableParseCheck: true });

    const merged = await reader.readDir(`${__dirname}/../fixtures`);

    assert.ok(merged.match(/Mutation/));
    assert.ok(merged.match(/Query/));
    assert.ok(merged.match(/Junk/));
    assert.ok(merged.match(/Stuff/));
  });
});
