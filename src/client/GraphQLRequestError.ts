import type { ExecutionResult } from "graphql";

export class GraphQLRequestError<
  TData = Record<string, unknown>
> extends Error {
  public readonly response: Response;
  public readonly result?: ExecutionResult<TData>;

  constructor(
    message: string,
    response: Response,
    result?: ExecutionResult<TData>
  ) {
    super(message);

    this.response = response;
    this.result = result;
  }
}
