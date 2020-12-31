/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import got from "got";
import { ExecutionResult } from "graphql";
import WebSocket from "ws";
import { GraphQLClientWebSocket } from "../../src";
import { GraphQLReader } from "../../src/read/GraphQLReader";
import { GraphQLWebSocketClient } from "../../src/ws/GraphQLWebSocketClient";
import { requireExampleServer } from "../util";

describe("A GraphQLWebSocketClient object", () => {
  let operations: string;

  requireExampleServer();

  before(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../../examples/client/operations`
    );
  });

  it("should be able to subscribe to the example server", async () => {
    const client = new GraphQLWebSocketClient({
      url: "ws://localhost:4999/graphql",
      protocol: "graphql-transport-ws",
      connect(url, protocol) {
        return new GraphQLClientWebSocket({
          socket: new WebSocket(url, protocol),
        });
      },
    });

    const results: ExecutionResult<any, any>[] = [];

    const iterator = await client.subscribe<ExecutionResult>({
      query: operations,
      operationName: "NewReviews",
      variables: {
        limit: 2,
      },
    });

    const complete = (async () => {
      for await (const result of iterator) {
        results.push(result);
      }
    })();

    await new Promise((resolve) => setTimeout(resolve, 300));

    await got("http://localhost:4999/graphql", {
      method: "POST",
      json: {
        query: operations,
        operationName: "CreateBossReview",
        variables: {
          input: {
            author: "tester",
            bossId: "1",
            difficulty: "IMPOSSIBLE",
            theme: "ALRIGHT",
          },
        },
      },
      responseType: "json",
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    await got("http://localhost:4999/graphql", {
      method: "POST",
      json: {
        query: operations,
        operationName: "CreateLocationReview",
        variables: {
          input: {
            author: "tester",
            locationId: "13",
            difficulty: "HARD",
            design: "STELLAR",
          },
        },
      },
      responseType: "json",
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    await complete;

    client.close();

    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        data: {
          newReviews: {
            ...it.data?.newReviews,
            createdAt: "test",
            id: "test",
          },
        },
      })),
      [
        {
          data: {
            newReviews: {
              __typename: "BossReview",
              author: "tester",
              boss: {
                id: "1",
                name: "Asylum Demon",
              },
              createdAt: "test",
              difficulty: "IMPOSSIBLE",
              id: "test",
              theme: "ALRIGHT",
            },
          },
        },
        {
          data: {
            newReviews: {
              __typename: "LocationReview",
              author: "tester",
              location: {
                id: "13",
                name: "Undead Parish",
              },
              createdAt: "test",
              difficulty: "HARD",
              id: "test",
              design: "STELLAR",
            },
          },
        },
      ]
    );
  });
});
