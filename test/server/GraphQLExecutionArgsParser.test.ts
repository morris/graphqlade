import * as assert from "assert";
import { print, parse } from "graphql";
import { GraphQLExecutionArgsParser } from "../../src";

describe("A GraphQLExecutionArgsParserExecutionArgsParser object", () => {
  it("should be able to parse a basic query", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = "{ praise }";
    const args = gqlExecutionArgsParser.parse({ query });

    assert.deepStrictEqual(print(args.document), print(parse(query)));
    assert.deepStrictEqual(args.operationName, undefined);
    assert.deepStrictEqual(args.variableValues, undefined);
  });

  it("should be able to parse a query with variables", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = "query Foo($baz: String!) { foo(bar: $baz) }";
    const args = gqlExecutionArgsParser.parse({
      query,
      variables: { baz: "test" },
    });

    assert.deepStrictEqual(print(args.document), print(parse(query)));
    assert.deepStrictEqual(args.operationName, undefined);
    assert.deepStrictEqual(args.variableValues, { baz: "test" });
  });

  it("should be able to parse a named query with variables", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = `
      query Foo($baz: String!) { foo(bar: $baz) }
      mutation Ignored { mutate }
    `;
    const args = gqlExecutionArgsParser.parse({
      query,
      variables: { baz: "test" },
      operationName: "Foo",
    });

    assert.deepStrictEqual(print(args.document), print(parse(query)));
    assert.deepStrictEqual(args.operationName, "Foo");
    assert.deepStrictEqual(args.variableValues, { baz: "test" });
  });

  it("should cache parsed documents", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = `
      query Foo($baz: String!) { foo(bar: $baz) }
      mutation Ignored { mutate }
    `;

    const cache = gqlExecutionArgsParser.getCache();
    assert.strictEqual(cache.size, 0);

    gqlExecutionArgsParser.parse({ query });
    assert.ok(cache.get(query));

    gqlExecutionArgsParser.parse({ query });
    assert.strictEqual(cache.size, 1);

    gqlExecutionArgsParser.parse({ query: `${query} # ignored` });
    assert.strictEqual(cache.size, 2);
  });

  it("should release cached documents in an LRU fashion", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser({
      cacheSize: 3,
    });

    const queryA = "{ a }";
    const queryB = "{ b }";
    const queryC = "{ c }";
    const queryD = "{ d }";

    const cache = gqlExecutionArgsParser.getCache();
    assert.strictEqual(cache.size, 0);

    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryB });
    gqlExecutionArgsParser.parse({ query: queryC });
    assert.strictEqual(cache.size, 3);

    gqlExecutionArgsParser.parse({ query: queryD });
    assert.strictEqual(cache.size, 3);
    assert.ok(!cache.get(queryA));

    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryB });
    gqlExecutionArgsParser.parse({ query: queryC });
    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryB });
    gqlExecutionArgsParser.parse({ query: queryC });
    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryD });
    assert.strictEqual(cache.size, 3);
    assert.ok(!cache.get(queryB));
  });
});
