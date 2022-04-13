import { DocumentNode, ExecutionArgs, parse } from "graphql";
import { assert, assertRecord, cleanOperations } from "../util";

export interface GraphQLExecutionArgsParserOptions {
  cacheSize?: number;
}

export interface GraphQLExecutionArgsParserCacheEntry {
  document: DocumentNode;
  index: number;
}

export interface RawExecutionArgs {
  query: unknown;
  operationName?: unknown;
  variables?: unknown;
}

export type ParsedExecutionArgs = Pick<
  ExecutionArgs,
  "document" | "operationName" | "variableValues"
>;

/**
 * query/operationName/variables parser with LRU caching for operations
 */
export class GraphQLExecutionArgsParser {
  protected cache = new Map<string, GraphQLExecutionArgsParserCacheEntry>();
  protected cacheSize: number;
  protected cacheIndex = 0;

  constructor(options?: GraphQLExecutionArgsParserOptions) {
    this.cacheSize = options?.cacheSize ?? 50;
  }

  parse(args: RawExecutionArgs): ParsedExecutionArgs {
    return {
      document: this.parseQuery(args.query),
      operationName: this.parseOperationName(args.operationName),
      variableValues: this.parseVariables(args.variables),
    };
  }

  parseQuery(query: unknown): DocumentNode {
    assert(typeof query === "string", "Invalid query, expected string");

    const cached = this.cache.get(query);

    if (cached) {
      cached.index = this.cacheIndex++;

      return cached.document;
    }

    const document = cleanOperations(parse(query));

    this.cache.set(query, {
      document,
      index: this.cacheIndex++,
    });

    if (this.cache.size > this.cacheSize) {
      const minIndex = this.cacheIndex - this.cacheSize;

      for (const [key, entry] of this.cache) {
        if (entry.index < minIndex) this.cache.delete(key);
      }
    }

    return document;
  }

  parseOperationName(operationName: unknown): string | undefined {
    if (
      operationName === "" ||
      operationName === null ||
      typeof operationName === "undefined"
    ) {
      return undefined;
    }

    assert(
      typeof operationName === "string",
      "Invalid operationName, expected string"
    );

    return operationName;
  }

  parseVariables(variables: unknown): Record<string, unknown> | undefined {
    if (
      variables === "" ||
      variables === null ||
      typeof variables === "undefined" ||
      variables === "null"
    ) {
      return undefined;
    }

    let parsed = variables;

    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (err) {
        throw new TypeError(
          `Invalid variables, failed to parse JSON: ${(err as Error).message}`
        );
      }
    }

    assertRecord(parsed, "Invalid variables, expected object");

    return parsed;
  }

  getCache() {
    return this.cache;
  }
}
