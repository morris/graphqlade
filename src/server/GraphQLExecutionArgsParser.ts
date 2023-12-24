import {
  DocumentNode,
  ExecutionArgs,
  GraphQLError,
  GraphQLSchema,
  ParseOptions,
  parse,
  validate,
} from 'graphql';
import { assert, cleanOperations, isRecord, limitDepth } from '../util';
import { LRUCache } from '../util/LRUCache';

export interface GraphQLExecutionArgsParserOptions extends ParseOptions {
  cacheSize?: number;
  maxDepth?: number;
}

export interface RawExecutionArgs {
  query: unknown;
  operationName?: unknown;
  variables?: unknown;
}

export type ParsedExecutionArgs = Pick<
  ExecutionArgs,
  'document' | 'operationName' | 'variableValues'
> & { originalQuery: string };

/**
 * query/operationName/variables parser and validator with LRU caching
 */
export class GraphQLExecutionArgsParser {
  protected parseOptions: ParseOptions;
  protected maxDepth?: number;
  protected parseQueryCache: LRUCache<string, DocumentNode>;
  protected validateCache: LRUCache<string, GraphQLError[]>;

  constructor(options?: GraphQLExecutionArgsParserOptions) {
    const { cacheSize, maxDepth, ...parseOptions } = options ?? {};
    this.parseOptions = parseOptions;
    this.maxDepth = maxDepth;
    this.parseQueryCache = new LRUCache(cacheSize ?? 50);
    this.validateCache = new LRUCache(cacheSize ?? 50);
  }

  parse(args: RawExecutionArgs): ParsedExecutionArgs {
    return {
      document: this.parseQuery(args.query),
      operationName: this.parseOperationName(args.operationName),
      variableValues: this.parseVariables(args.variables),
      originalQuery: args.query as string, // asserted in parseQuery
    };
  }

  parseQuery(query: unknown): DocumentNode {
    assert(typeof query === 'string', 'Invalid query, expected string');

    const cached = this.parseQueryCache.get(query);
    if (cached) return cached;

    const document = cleanOperations(parse(query, this.parseOptions));

    if (this.maxDepth) {
      limitDepth(document, this.maxDepth);
    }

    this.parseQueryCache.set(query, document);

    return document;
  }

  parseOperationName(operationName: unknown): string | undefined {
    if (
      operationName === '' ||
      operationName === null ||
      typeof operationName === 'undefined'
    ) {
      return undefined;
    }

    assert(
      typeof operationName === 'string',
      'Invalid operationName, expected string',
    );

    return operationName;
  }

  parseVariables(variables: unknown): Record<string, unknown> | undefined {
    if (
      variables === '' ||
      variables === null ||
      typeof variables === 'undefined' ||
      variables === 'null'
    ) {
      return undefined;
    }

    let parsed = variables;

    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (err) {
        throw new TypeError(
          `Invalid variables, failed to parse JSON: ${(err as Error).message}`,
        );
      }
    }

    assert(isRecord(parsed), 'Invalid variables, expected object');

    return parsed;
  }

  validate(schema: GraphQLSchema, args: ParsedExecutionArgs) {
    const cached = this.validateCache.get(args.originalQuery);
    if (cached) return cached;

    const errors = validate(schema, args.document) as GraphQLError[];

    this.validateCache.set(args.originalQuery, errors);

    return errors;
  }
}
