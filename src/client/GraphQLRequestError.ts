import type { ExecutionResult } from 'graphql';

export class GraphQLRequestError<
  TData = Record<string, unknown>,
> extends Error {
  public readonly response: Response;
  public readonly result?: ExecutionResult<TData>;
  public readonly json?: unknown;

  constructor(
    message: string,
    response: Response,
    result?: ExecutionResult<TData>,
    json?: unknown,
  ) {
    super(message);

    this.response = response;
    this.result = result;
    this.json = result ?? json;
  }
}
