// keep granular imports here fore browser build
import type { ExecutionResult } from "graphql";
import { toError } from "../util/toError";
import { GraphQLRequestError } from "./GraphQLRequestError";

export interface GraphQLClientOptions<TTypings extends GraphQLClientTypings> {
  url: string;
  fetch?: typeof fetch;
  init?: GraphQLRequestInit;
  typings?: TTypings;
}

export interface GraphQLClientTypings {
  QueryName: string | never;
  MutationName: string | never;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OperationNameToVariables: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OperationNameToData: any;
  OperationNameToDocument: Record<string, string>;
}

export interface GraphQLRequestOptions extends GraphQLRequestInit {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export type GraphQLRequestInit = Omit<
  RequestInit,
  "headers" | "body" | "method"
> & {
  headers?: Record<string, string>;
};

export class GraphQLClient<
  TTypings extends GraphQLClientTypings = GraphQLClientTypings
> {
  protected url: string;
  protected customFetch?: typeof fetch;
  protected init: GraphQLRequestInit;
  protected operations: TTypings["OperationNameToDocument"];

  constructor(options: GraphQLClientOptions<TTypings>) {
    this.url = options.url;
    this.customFetch = options.fetch;
    this.init = { ...options.init, headers: { ...options.init?.headers } };
    this.operations = options.typings?.OperationNameToDocument ?? {};
  }

  setHeaders(headers: Record<string, string>) {
    this.init.headers = { ...this.init.headers, ...headers };
  }

  async postNamed<
    TOperationName extends TTypings["QueryName"] | TTypings["MutationName"]
  >(
    operationName: TOperationName,
    variables: TTypings["OperationNameToVariables"][TOperationName],
    init?: GraphQLRequestInit
  ) {
    return this.post<TTypings["OperationNameToData"][TOperationName]>({
      ...init,
      query: this.operations[operationName],
      operationName,
      variables,
    });
  }

  async post<TData>({
    query,
    variables,
    operationName,
    headers,
    ...init
  }: GraphQLRequestOptions) {
    const fetch_ = this.customFetch ?? fetch;

    const response = await fetch_(this.url, {
      ...this.init,
      ...init,
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...this.init?.headers,
        ...headers,
      },
      body: JSON.stringify({ query, variables, operationName }),
    });

    return this.parseResponse<TData>(response);
  }

  async parseResponse<TData>(response: Response) {
    const suffix = response.ok
      ? ""
      : `; ${response.status} ${response.statusText}`;

    let result: ExecutionResult<TData>;

    try {
      result = await response.json();
    } catch (err) {
      throw new GraphQLRequestError(
        `Not a GraphQL response: ${toError(err).message}${suffix}`,
        response
      );
    }

    if (!this.isResult(result)) {
      throw new GraphQLRequestError(
        `Not a GraphQL response${suffix}`,
        response
      );
    }

    if (result.errors && result.errors.length > 0) {
      throw new GraphQLRequestError(
        `GraphQL error(s)${suffix}`,
        response,
        result
      );
    }

    return result;
  }

  isResult(json: unknown) {
    return (
      json && typeof json === "object" && ("data" in json || "errors" in json)
    );
  }
}
