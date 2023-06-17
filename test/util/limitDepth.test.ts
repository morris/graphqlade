import { getIntrospectionQuery, parse } from "graphql";
import { limitDepth } from "../../src";

describe("The getDepth function", () => {
  const testCases: [string, number][] = [
    ["{ praise }", 0],
    ["{ praise { the sun } }", 1],
    ["{ praise { the { sun } } }", 2],
    ["{ praise { the { sun } x } }", 2],
    ["{ praise ...f } fragment f on t { x }", 0],
    ["{ praise ...f } fragment f on t { x { y } }", 1],
    [
      `
        { praise ...f ...g }
        fragment f on t { x { y } }
        fragment g on t { x { y { z } } }
      `,
      2,
    ],
    [
      `
        { praise ...f }
        fragment f on t { x { y ...g } }
        fragment g on t { x { y { z } } }
      `,
      3,
    ],
    [
      `
        query a { praise ...f }
        fragment f on t { x { y ...g } }
        fragment g on t { x { y { z } } }
        query b { praise x { y x { y { z } } } }
      `,
      3,
    ],
  ];

  it("should limit the depth of GraphQL operations", () => {
    for (const [operation, maxDepth] of testCases) {
      expect(() => limitDepth(parse(operation), maxDepth)).not.toThrow();
      expect(() => limitDepth(parse(operation), maxDepth - 1)).toThrow();
    }
  });

  it("should throw on circular fragment spreads", () => {
    expect(() =>
      limitDepth(
        parse(`
          query a { praise ...f }
          fragment f on t { x { y ...f } }
        `),
        999
      )
    ).toThrow("Invalid query, contains circular fragment spreads");

    expect(() =>
      limitDepth(
        parse(`
          query a { praise ...f }
          fragment f on t { x { y ...g } }
          fragment g on t { x { y ...f } }
        `),
        999
      )
    ).toThrow("Invalid query, contains circular fragment spreads");
  });

  it("should ignore introspection queries", () => {
    expect(() => limitDepth(parse(getIntrospectionQuery()), 1)).not.toThrow();
  });
});
