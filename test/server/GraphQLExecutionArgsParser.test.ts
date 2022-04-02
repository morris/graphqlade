import { parse, print } from "graphql";
import { GraphQLExecutionArgsParser } from "../../src";

describe("A GraphQLExecutionArgsParserExecutionArgsParser object", () => {
  it("should be able to parse a basic query", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = "{ praise }";
    const args = gqlExecutionArgsParser.parse({ query });

    expect(print(args.document)).toEqual(print(parse(query)));
    expect(args.operationName).toBeUndefined();
    expect(args.variableValues).toBeUndefined();
  });

  it("should be able to parse a query with variables", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = "query Foo($baz: String!) { foo(bar: $baz) }";
    const args = gqlExecutionArgsParser.parse({
      query,
      variables: { baz: "test" },
    });

    expect(print(args.document)).toEqual(print(parse(query)));
    expect(args.operationName).toBeUndefined();
    expect(args.variableValues).toEqual({ baz: "test" });
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

    expect(print(args.document)).toEqual(print(parse(query)));
    expect(args.operationName).toEqual("Foo");
    expect(args.variableValues).toEqual({ baz: "test" });
  });

  it("should cache parsed documents", async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = `
      query Foo($baz: String!) { foo(bar: $baz) }
      mutation Ignored { mutate }
    `;

    const cache = gqlExecutionArgsParser.getCache();
    expect(cache.size).toEqual(0);

    gqlExecutionArgsParser.parse({ query });
    expect(cache.get(query)).toBeDefined();

    gqlExecutionArgsParser.parse({ query });
    expect(cache.size).toEqual(1);

    gqlExecutionArgsParser.parse({ query: `${query} # ignored` });
    expect(cache.size).toEqual(2);
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
    expect(cache.size).toEqual(0);

    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryB });
    gqlExecutionArgsParser.parse({ query: queryC });
    expect(cache.size).toEqual(3);

    gqlExecutionArgsParser.parse({ query: queryD });
    expect(cache.size).toEqual(3);
    expect(cache.get(queryA)).toBeUndefined();

    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryB });
    gqlExecutionArgsParser.parse({ query: queryC });
    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryB });
    gqlExecutionArgsParser.parse({ query: queryC });
    gqlExecutionArgsParser.parse({ query: queryA });
    gqlExecutionArgsParser.parse({ query: queryD });
    expect(cache.size).toEqual(3);
    expect(cache.get(queryB)).toBeUndefined();
  });
});
