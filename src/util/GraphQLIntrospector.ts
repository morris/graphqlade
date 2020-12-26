import {
  buildClientSchema,
  getIntrospectionQuery,
  GraphQLError,
  IntrospectionOptions,
  IntrospectionQuery,
} from "graphql";

export interface GraphQLIntrospectorOptions {
  request: IntrospectionRequestFn;
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

export interface IntrospectionQueryResult {
  data: IntrospectionQuery;
  errors?: GraphQLError[];
}

export class GraphQLIntrospector {
  protected request: IntrospectionRequestFn;

  constructor(options: GraphQLIntrospectorOptions) {
    this.request = options.request;
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
    const r = await this.request({
      url,
      method: "POST",
      headers: this.getHeaders(headers),
      json: this.getIntrospectionQueryBody(introspectionOptions),
      responseType: "json",
    });

    return this.validateIntrospectionQueryResult(r.body);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateIntrospectionQueryResult(body: any): IntrospectionQuery {
    if (!body) {
      throw new Error("Introspection failed: Empty response body");
    }

    if (typeof body !== "object") {
      throw new Error("Introspection failed: Invalid response body");
    }

    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const errors = body.errors as GraphQLError[];
      throw new Error(
        `Introspection failed: ${errors.map((it) =>
          typeof it.message === "string" ? it.message : "Unknown error"
        )}`
      );
    }

    if (!body.data) {
      throw new Error("Introspection failed: No data");
    }

    if (typeof body.data !== "object") {
      throw new Error("Introspection failed: Invalid data");
    }

    return body.data;
  }

  getHeaders(headers?: Record<string, string>): Record<string, string> {
    return {
      "content-type": "application/json",
      accept: "application/json",
      ...headers,
    };
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
