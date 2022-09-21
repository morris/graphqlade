import {
  execute,
  executeSync,
  GraphQLEnumType,
  GraphQLError,
  parse,
} from "graphql";
import { GraphQLDateTime } from "graphql-scalars";
import path from "path";
import { GraphQLReader, GraphQLServer } from "../../src";

describe("The GraphQLServer", () => {
  it("should be able to bootstrap an executable schema", async () => {
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root: `${__dirname}/../../examples/server`,
      createContext() {
        return undefined;
      },
    });

    gqlServer.setResolvers({
      Query: {
        praise() {
          return "the sun!";
        },
      },
    });

    const result = execute({
      schema: gqlServer.schema,
      document: parse(`
        { praise }
      `),
    });

    expect(result).toEqual({
      data: {
        praise: "the sun!",
      },
    });
  });

  it("should add enum and scalar resolvers correctly", async () => {
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root: `${__dirname}/../../examples/server`,
      createContext() {
        return undefined;
      },
    });

    gqlServer.setResolvers({
      Query: {
        reviews() {
          return [{ theme: 1 }];
        },
      },
      Review: {
        __resolveType() {
          return "BossReview";
        },
        createdAt() {
          return 1000;
        },
      },
      BossReview: {
        theme(data: { theme: number }) {
          return data.theme;
        },
      },
      Rating: {
        TERRIBLE: 1,
        MEH: 2,
        ALRIGHT: 3,
        AMAZING: 4,
        STELLAR: 5,
      },
      DateTime: GraphQLDateTime,
    });

    const enumType = gqlServer.schema.getType("Rating") as GraphQLEnumType;

    expect(enumType.parseValue("TERRIBLE")).toEqual(1);
    expect(enumType.serialize(1)).toEqual("TERRIBLE");

    const result = execute({
      schema: gqlServer.schema,
      document: parse(`
        { reviews { createdAt ... on BossReview { theme } } }
      `),
    });

    expect(result).toEqual({
      data: {
        reviews: [
          {
            createdAt: new Date("1970-01-01T00:00:01.000Z"),
            theme: "TERRIBLE",
          },
        ],
      },
    });
  });

  it("should not resolve SDL fields when stitching is disabled", async () => {
    const root = `${__dirname}/../../examples/server`;
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root,
      createContext() {
        return undefined;
      },
    });

    const result = execute({
      schema: gqlServer.schema,
      document: parse(`
        { _sdl _sdlVersion }
      `),
    });

    expect(result).toEqual({
      data: null,
      errors: [
        new GraphQLError(
          "Cannot return null for non-nullable field Query._sdl."
        ),
      ],
    });
  });

  it("should resolve SDL fields when stitching is enabled", async () => {
    const root = `${__dirname}/../../examples/server`;
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root,
      createContext() {
        return undefined;
      },
      stitching: true,
    });

    const result = execute({
      schema: gqlServer.schema,
      document: parse(`
        { _sdl _sdlVersion }
      `),
    });

    const reader = new GraphQLReader();
    const sdl = await reader.readDir(path.join(root, "schema"));

    expect(result).toEqual({
      data: {
        _sdl: sdl,
        _sdlVersion: "79b0cab0ba9ca035d10e57c2d739eace9be2a044",
      },
    });
  });

  it("should be able to set a resolver error handler", async () => {
    const errors: Error[] = [];

    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root: `${__dirname}/../../examples/server`,
      createContext() {
        return undefined;
      },
    });

    gqlServer.setResolvers({
      Query: {
        praise() {
          return "the sun!";
        },
        boss() {
          throw new Error("sync thrown error");
        },
        bosses() {
          return new Promise((_, reject) =>
            setTimeout(() => reject(new Error("rejection")), 50)
          );
        },
        async locations() {
          throw new Error("async thrown error");
        },
      },
    });

    gqlServer.setResolverErrorHandler((err) => {
      errors.push(err);
    });

    const resultSync = executeSync({
      schema: gqlServer.schema,
      document: parse(`
        { praise boss(id: "dont care") }
      `),
    });

    expect(resultSync).toEqual({
      data: {
        praise: "the sun!",
        boss: null,
      },
      errors: [new GraphQLError("sync thrown error")],
    });

    const resultAsync = await execute({
      schema: gqlServer.schema,
      document: parse(`
        { praise boss(id: "dont care") bosses { id } locations { id } }
      `),
    });

    expect(resultAsync).toEqual({
      data: {
        praise: "the sun!",
        boss: null,
        bosses: null,
        locations: null,
      },
      errors: [
        new GraphQLError("sync thrown error"),
        new GraphQLError("async thrown error"),
        new GraphQLError("rejection"),
      ],
    });

    expect(errors).toEqual([
      new Error("sync thrown error"),
      new Error("sync thrown error"),
      new Error("async thrown error"),
      new Error("rejection"),
    ]);
  });
});
