import { GraphQLClient, GraphQLRequestError } from "../../src";
import { mockFetch, mockFetchJson, mockJsonResponse } from "../util";

const OperationNameToDocument = {
  Query1: "dont care",
  Query2: "dont care",
  Mutation1: "dont care",
  Subscription1: "dont care",
};

interface OperationNameToVariables {
  Query1: undefined;
  Query2: { count: number };
  Mutation1: undefined;
}

interface OperationNameToData {
  Query1: { query1: boolean };
  Query2: { query2: number };
  Mutation1: { mutation1: string };
}

type OperationName = QueryName | MutationName | SubscriptionName;

type QueryName = "Query1" | "Query2";

type MutationName = "Mutation1";

type SubscriptionName = never;

interface OperationTypings {
  OperationName: OperationName;
  QueryName: QueryName;
  MutationName: MutationName;
  SubscriptionName: SubscriptionName;
  OperationNameToVariables: OperationNameToVariables;
  OperationNameToData: OperationNameToData;
  OperationNameToDocument: Record<OperationName, string>;
}

describe("The GraphQLClient", () => {
  const url = "https://localhost:4000/graphql";
  const operations = OperationNameToDocument;

  it("should be able to send GraphQL requests via POST (typed with operation typings)", async () => {
    const expectedResult = { data: { query2: 1 } };

    const client = new GraphQLClient<OperationTypings>({
      url,
      operations,
      init: {
        headers: {
          authorization: "Bearer of a ring",
        },
        cache: "default",
      },
      async fetch(info, init) {
        expect(info).toEqual(url);
        expect(init).toEqual({
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            authorization: "Bearer of a ring",
            "x-test": "lol",
          },
          body: '{"query":"dont care","variables":{"count":1},"operationName":"Query2"}',
          credentials: "include",
          cache: "default",
        });

        return mockJsonResponse(expectedResult);
      },
    });

    const result = await client.post(
      "Query2",
      { count: 1 },
      { credentials: "include", headers: { "x-test": "lol" } }
    );

    expect(result).toEqual(expectedResult);
  });

  it("should be able to send GraphQL requests via POST (untyped)", async () => {
    const expectedResult = { data: { query2: 1 } };

    const client = new GraphQLClient({
      url,
      operations,
      fetch: mockFetchJson(expectedResult),
    });

    const result = await client.post("Query2", { count: 1 });

    expect(result).toEqual(expectedResult);
  });

  it("should handle responses with GraphQL errors correctly", async () => {
    const expectedResult = {
      data: { query2: null },
      errors: [{ message: "failure" }],
    };

    const client = new GraphQLClient({
      url,
      operations,
      fetch: mockFetchJson(expectedResult),
    });

    try {
      await client.post("Query2", { count: 1 });
      throw new Error("should not succeed");
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        expect(err.message).toEqual("GraphQL error(s)");
        expect(err.response.ok).toEqual(true);
        expect(err.result).toEqual(expectedResult);
      } else {
        throw err;
      }
    }
  });

  it("should handle non-2xx responses correctly", async () => {
    const expectedResult = {
      data: { query2: null },
      errors: [{ message: "failure" }],
    };

    const client = new GraphQLClient({
      url,
      operations,
      fetch: mockFetchJson(expectedResult, {
        ok: false,
        status: 400,
        statusText: "Bad request",
      }),
    });

    try {
      await client.post("Query2", { count: 1 });
      throw new Error("should not succeed");
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        expect(err.message).toEqual("GraphQL error(s); 400 Bad request");
        expect(err.response.ok).toEqual(false);
        expect(err.result).toEqual(expectedResult);
      } else {
        throw err;
      }
    }
  });

  it("should handle non-GraphQL JSON responses correctly", async () => {
    const client = new GraphQLClient({
      url,
      operations,
      fetch: mockFetchJson({ not: "graphql" }),
    });

    try {
      await client.post("Query2", { count: 1 });
      throw new Error("should not succeed");
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        expect(err.message).toEqual("Not a GraphQL response");
        expect(err.response.ok).toEqual(true);
        expect(err.result).toBeUndefined();
      } else {
        throw err;
      }
    }
  });

  it("should handle non-JSON responses correctly", async () => {
    const client = new GraphQLClient({
      url,
      operations,
      fetch: mockFetch({
        async json() {
          throw new Error("Unexpected input <");
        },
      }),
    });

    try {
      await client.post("Query2", { count: 1 });
      throw new Error("should not succeed");
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        expect(err.message).toEqual(
          "Not a GraphQL response: Unexpected input <"
        );
        expect(err.response.ok).toEqual(true);
        expect(err.result).toBeUndefined();
      } else {
        throw err;
      }
    }
  });

  it("should handle non-GraphQL, non-2xx responses correctly", async () => {
    const client = new GraphQLClient({
      url,
      operations,
      fetch: mockFetchJson(
        { error: "Server down" },
        { ok: false, status: 503, statusText: "Unavailable" }
      ),
    });

    try {
      await client.post("Query2", { count: 1 });
      throw new Error("should not succeed");
    } catch (err) {
      if (err instanceof GraphQLRequestError) {
        expect(err.message).toEqual("Not a GraphQL response; 503 Unavailable");
        expect(err.response.ok).toEqual(false);
        expect(err.result).toBeUndefined();
      } else {
        throw err;
      }
    }
  });
});
