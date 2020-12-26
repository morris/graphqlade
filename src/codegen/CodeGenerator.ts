import * as path from "path";
import { ClientCodeGenerator } from "./ClientCodeGenerator";
import { ServerCodeGenerator } from "./ServerCodeGenerator";
import { GraphQLReader } from "../util/GraphQLReader";
import {
  GraphQLIntrospector,
  IntrospectionRequestFn,
} from "../util/GraphQLIntrospector";
import { watchRecursive, writeTypeScript } from "../util";
import { validate } from "graphql";
import { cleanOperations } from "../util/cleanOperations";

export interface CodeGeneratorOptions {
  root?: string;
  schema?: string;
  operations?: string;
  introspection?: IntrospectionOptions;
  out?: string;
}

export interface IntrospectionOptions {
  url: string;
  request: IntrospectionRequestFn;
}

export interface CodeGeneratorCliOptions {
  server?: boolean;
  client?: boolean;
  watch?: boolean;
  logger?: CodeGeneratorLogger;
}

export interface CodeGeneratorLogger {
  log: (message: string) => void;
  error: (message: string) => void;
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

    this.reader = new GraphQLReader();
    this.introspector = this.introspection
      ? new GraphQLIntrospector(this.introspection)
      : undefined;
  }

  async cli(options: CodeGeneratorCliOptions & { argv?: string[] }) {
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
      await this.write(options);

      if (options.watch) {
        logger.log("Initial generation done. Watching for changes...");
      } else {
        return;
      }
    } catch (err) {
      if (!options.watch) throw err;

      logger.error(err.stack);
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

          logger.log(`Change detected (${filename}), regenerating...`);
          await this.write(options);
          logger.log("Done. Watching for changes...");
        } catch (err) {
          logger.error(err.stack);
        }
      }, 100);
    };

    if (options.server || (options.client && !this.introspection)) {
      await watchRecursive(schema, callback);
    }

    if (options.client) {
      await watchRecursive(operations, callback);
    }
  }

  async write(options: Omit<CodeGeneratorCliOptions, "watch">) {
    if (options.server) await this.writeServer();
    if (options.client) await this.writeClient();
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
      this.introspection.url
    );
  }
}
