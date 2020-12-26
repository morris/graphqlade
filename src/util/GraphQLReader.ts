import { readdir, readFile, stat } from "fs/promises";
import { Stats } from "fs";
import { join } from "path";
import { buildSchema, GraphQLError, parse } from "graphql";
import { compare } from "./misc";

export interface GraphQLReaderOptions {
  disableParseCheck?: boolean;
  disableCaching?: boolean;
}

export interface GraphQLReaderCacheEntry {
  stats: Stats;
  document: string;
}

export class GraphQLReader {
  protected disableParseCheck: boolean;
  protected disableCaching: boolean;
  protected cache = new Map<string, GraphQLReaderCacheEntry>();

  constructor(options?: GraphQLReaderOptions) {
    this.disableParseCheck = options?.disableParseCheck ?? false;
    this.disableCaching = options?.disableCaching ?? false;
  }

  async buildSchemaFromDir(dirname: string) {
    return buildSchema(await this.readDir(dirname));
  }

  async parseDir(dirname: string) {
    return parse(await this.readDir(dirname));
  }

  async readDir(dirname: string): Promise<string> {
    const filenames = await readdir(dirname, { withFileTypes: true });

    const fromFiles = await Promise.all(
      filenames
        .filter((it) => it.isFile())
        .filter((it) => this.isGraphQLFile(it.name))
        .map((it) => join(dirname, it.name))
        .sort(compare)
        .map((it) => this.readFile(it))
    );

    const fromDirs = await Promise.all(
      filenames
        .filter((it) => it.isDirectory())
        .map((it) => join(dirname, it.name))
        .sort(compare)
        .map((it) => this.readDir(it))
    );

    return [...fromFiles, ...fromDirs].join("\n\n");
  }

  async readFile(filename: string) {
    if (this.disableCaching) return this.readFileFresh(filename);

    const stats = await stat(filename);
    const cached = this.cache.get(filename);

    if (cached && cached.stats.mtimeMs >= stats.mtimeMs) {
      return cached.document;
    }

    const document = await this.readFileFresh(filename);

    this.cache.set(filename, { stats, document });

    return document;
  }

  protected async readFileFresh(filename: string) {
    const document = await readFile(filename, "utf-8");

    if (!this.disableParseCheck) this.parseCheck(filename, document);

    return document;
  }

  parseCheck(filename: string, document: string) {
    try {
      parse(document);
    } catch (err) {
      if (err instanceof GraphQLError) {
        const firstLocation = err.locations?.[0];
        const location = firstLocation
          ? `:${firstLocation.line}:${firstLocation.column}`
          : "";
        err.message = `${err.message} at ${filename}${location}`;
      }

      throw err;
    }
  }

  isGraphQLFile(filename: string) {
    return filename.match(/\.g(raph)?ql$/i);
  }
}
