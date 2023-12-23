import type { ExecutionResult } from 'graphql';

export class GraphQLResultError<TData = Record<string, unknown>> extends Error {
  public readonly result: ExecutionResult<TData>;

  constructor(result: ExecutionResult<TData>) {
    super(
      `GraphQL error(s): ${result.errors
        ?.map((err) => err.message)
        .join('; ')}`,
    );
    this.result = result;
  }
}
