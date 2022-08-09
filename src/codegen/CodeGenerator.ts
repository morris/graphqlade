import fs from "fs";
import { validate } from "graphql";
import * as path from "path";
import { stitchingDirectives } from "@graphql-tools/stitching-directives";
import { GraphQLIntrospector, IntrospectionRequestFn } from "../introspect";
import { GraphQLReader } from "../read";
import {
  cleanOperations,
  LoggerLike,
  toError,
  watchRecursive,
  writeTypeScript,
} from "../util";
import { ClientCodeGenerator } from "./ClientCodeGenerator";
import { ServerCodeGenerator } from "./ServerCodeGenerator";

export interface CodeGeneratorOptions {
  /**
   * Path to root directory for code generation.
   * It's recommended to use a root relative to __dirname.
   * Defaults to the current working dir.
   */
  root?: string;

  /**
   * Path to directory of GraphQL schema documents, relative to root.
   * Defaults to "schema".
   */
  schema?: string;

  /**
   * Path to directory of GraphQL operation documents, relative to root.
   * Defaults to "operations".
   */
  operations?: string;

  /**
   * Introspection options (only required for client-code generation)
   */
  introspection?: IntrospectionOptions;

  /**
   * Path to directory to place generated code, relative to root.
   * Defaults to "src/generated".
   */
  out?: string;

  reader?: GraphQLReader;

  introspector?: GraphQLIntrospector;
}

export interface IntrospectionOptions {
  /**
   * URL of GraphQL API to fetch introspection from.
   */
  url: string;

  fetch?: typeof fetch;

  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;

  /**
   * Request function to use for introspection.
   * Can also be used to run e.g. authentication beforehand.
   *
   * @deprecated
   */
  request?: IntrospectionRequestFn;
}

export interface CodeGeneratorCliOptions {
  /**
   * Should server types be generated? Defaults to false.
   */
  server?: boolean;

  /**
   * Should client types be generated? Defaults to false.
   */
  client?: boolean;

  /**
   * Should the CLI run in watch mode? Defaults to false.
   */
  watch?: boolean;

  /**
   * Set command-line arguments. Defaults to process.argv.
   */
  argv?: string[];

  /**
   * The logger used in the CLI. Defaults to console.
   */
  logger?: LoggerLike;

  /*
   *
   */
  useStitchingDirectives?: boolean;
}

export class CodeGenerator {
  protected root: string;
  protected schema: string;
  protected operations: string;
  protected introspection?: IntrospectionOptions;
  protected out: string;
  protected reader: GraphQLReader;
  protected introspector?: GraphQLIntrospector;

  constructor(options?: CodeGeneratorOptions) {
    this.root = options?.root ?? "";
    this.schema = options?.schema ?? "schema";
    this.operations = options?.operations ?? "operations";
    this.introspection = options?.introspection;
    this.out = options?.out ?? "src/generated";

    this.reader = options?.reader ?? new GraphQLReader();
    this.introspector =
      options?.introspector ??
      (this.introspection
        ? new GraphQLIntrospector(this.introspection)
        : undefined);
  }

  async cli(options: CodeGeneratorCliOptions) {
    const argv =
      !options.argv || options.argv === process.argv
        ? process.argv.slice(2)
        : options.argv;

    for (let i = 0; i < argv.length; ++i) {
      switch (argv[i]) {
        case "--watch":
        case "-w":
          return this.run({ ...options, watch: true });
      }
    }

    return this.run(options);
  }

  async run(options: CodeGeneratorCliOptions) {
    const logger = options?.logger ?? console;

    try {
      await this.writeTsDirectiveDefinition(options);
      await this.writeStitchingDirectiveDefinition(options);
      await this.write(options);

      if (options.watch) {
        logger.log("Initial generation done. Watching for changes...");
      } else {
        return;
      }
    } catch (err) {
      if (!options.watch) throw err;

      logger.error(toError(err));
      logger.log("Initial generation failed. Watching for changes...");
    }

    await this.watch(options);
  }

  async watch(options: Omit<CodeGeneratorCliOptions, "watch">) {
    const logger = options?.logger ?? console;
    const schema = path.join(this.root, this.schema);
    const operations = path.join(this.root, this.operations);

    let callbackTimeout: NodeJS.Timeout;

    const callback = (filename: string) => {
      clearTimeout(callbackTimeout);

      callbackTimeout = setTimeout(async () => {
        try {
          if (!this.reader.isGraphQLFile(filename)) return;

          logger.log(
            `Change detected (${path.relative(
              schema,
              filename
            )}), regenerating...`
          );

          await this.write(options);

          logger.log("Done. Watching for changes...");
        } catch (err) {
          logger.error(toError(err));
        }
      }, 100);
    };

    if (options.server || (options.client && !this.introspection)) {
      await watchRecursive({
        dirname: schema,
        callback,
        match: (path, stats) =>
          stats.isDirectory() || this.reader.isGraphQLFile(path),
      });
    }

    if (options.client) {
      await watchRecursive({
        dirname: operations,
        callback,
        match: (path, stats) =>
          stats.isDirectory() || this.reader.isGraphQLFile(path),
      });
    }
  }

  async write(options: Omit<CodeGeneratorCliOptions, "watch">) {
    if (options.server) await this.writeServer();
    if (options.client) await this.writeClient();
  }

  async writeTsDirectiveDefinition(
    options: Omit<CodeGeneratorCliOptions, "watch">
  ) {
    if (options.server) {
      await fs.promises.writeFile(
        path.join(this.root, this.schema, "_ts.gql"),
        this.getTsDirectiveDefinition()
      );
    }

    if (options.client) {
      await fs.promises.writeFile(
        path.join(this.root, this.operations, "_ts.gql"),
        this.getTsDirectiveDefinition()
      );
    }
  }

  async writeStitchingDirectiveDefinition(
    options: Omit<CodeGeneratorCliOptions, "watch">
  ) {
    if (options.server && options.useStitchingDirectives) {
      await fs.promises.writeFile(
        path.join(this.root, this.schema, "_stitching.gql"),
        this.getStitchingDirectiveDefinition()
      );
    }
  }

  //

  async writeServer() {
    await writeTypeScript(
      path.join(this.root, this.out, "schema.ts"),
      await this.generateServer()
    );
  }

  async writeClient() {
    await writeTypeScript(
      path.join(this.root, this.out, "operations.ts"),
      await this.generateClient()
    );
  }

  getTsDirectiveDefinition() {
    return `directive @ts(
  type: String!
  inputType: String
  from: String
) on OBJECT | INTERFACE | ENUM | SCALAR
`;
  }

  getStitchingDirectiveDefinition() {
    const { allStitchingDirectivesTypeDefs } = stitchingDirectives();
    return `${allStitchingDirectivesTypeDefs}

extend type Query {
  _sdl: String!
}
`;
  }

  //

  async generateServer() {
    const serverCodeGenerator = new ServerCodeGenerator({
      schema: await this.buildSchema(),
    });

    return serverCodeGenerator.generateServer();
  }

  async generateClient() {
    const schema = this.introspection
      ? await this.buildClientSchemaFromIntrospection()
      : await this.buildSchema();

    const operations = await this.parseOperations();

    const errors = validate(schema, cleanOperations(operations));

    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors.map((it) => it.message).join(" ")}`
      );
    }

    const clientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    return clientCodeGenerator.generateClient();
  }

  //

  async buildSchema() {
    return this.reader.buildSchemaFromDir(path.join(this.root, this.schema));
  }

  async parseOperations() {
    return this.reader.parseDir(path.join(this.root, this.operations));
  }

  async buildClientSchemaFromIntrospection() {
    if (!this.introspection || !this.introspector) {
      throw new Error("Missing 'introspection' option");
    }

    return this.introspector.buildClientSchemaFromIntrospection(
      this.introspection.url,
      this.introspection.getHeaders
        ? await this.introspection.getHeaders()
        : undefined
    );
  }
}
