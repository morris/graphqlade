import {
  buildClientSchema,
  getIntrospectionQuery,
  GraphQLError,
  IntrospectionOptions,
  IntrospectionQuery,
} from "graphql";
import { GraphQLClient } from "../client";
import { assert, assertRecord } from "../util";

export interface GraphQLIntrospectorOptions {
  fetch?: typeof fetch;

  /** @deprecated */
  request?: IntrospectionRequestFn;
}

export type IntrospectionRequestFn = (
  options: IntrospectionRequestFnOptions
) => Promise<{ body: unknown }>;

export interface IntrospectionRequestFnOptions {
  url: string;
  method: "POST";
  headers: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any;
  responseType: "json";
}

export class GraphQLIntrospector {
  protected customFetch?: typeof fetch;
  protected request?: IntrospectionRequestFn;

  constructor(options?: GraphQLIntrospectorOptions) {
    this.customFetch = options?.fetch;
    this.request = options?.request;
  }

  async buildClientSchemaFromIntrospection(
    url: string,
    headers?: Record<string, string>,
    introspectionOptions?: IntrospectionOptions
  ) {
    return buildClientSchema(
      await this.introspect(url, headers, introspectionOptions)
    );
  }

  async introspect(
    url: string,
    headers?: Record<string, string>,
    introspectionOptions?: IntrospectionOptions
  ) {
    // TODO legacy got-based request, remove in 2.0
    if (this.request) {
      const response = await this.request({
        url,
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...headers,
        },
        json: this.getIntrospectionQueryBody(introspectionOptions),
        responseType: "json",
      });

      return this.validateIntrospectionQueryResult(response.body);
    }
    //

    const client = new GraphQLClient({
      url,
      fetch: this.customFetch,
      init: { headers },
    });
    const result = await client.post(
      this.getIntrospectionQueryBody(introspectionOptions)
    );

    return this.validateIntrospectionQueryResult(result);
  }

  validateIntrospectionQueryResult(result: unknown): IntrospectionQuery {
    // TODO a lot of this is covered by the GraphQLClient; simplify in 2.0
    assert(!!result, "Introspection failed: Empty response body");
    assertRecord(result, "Introspection failed: Invalid response body");

    if (Array.isArray(result.errors) && result.errors.length > 0) {
      const errors = result.errors as GraphQLError[];
      throw new Error(
        `Introspection failed: ${errors.map((it) =>
          typeof it.message === "string" ? it.message : "Unknown error"
        )}`
      );
    }

    assert(!!result.data, "Introspection failed: No data");
    assertRecord(result.data, "Introspection failed: Invalid data");

    return result.data as unknown as IntrospectionQuery;
  }

  getIntrospectionQueryBody(introspectionOptions?: IntrospectionOptions) {
    return {
      query: getIntrospectionQuery({
        descriptions: true,
        schemaDescription: true,
        directiveIsRepeatable: true,
        specifiedByUrl: true,
        ...introspectionOptions,
      }),
    };
  }
}
