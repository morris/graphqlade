/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from "assert";
import got from "got";
import { ExecutionResult } from "graphql";
import WebSocket from "ws";
import {
  DeferredPromise,
  GraphQLClientWebSocket,
  GraphQLReader,
} from "../../src";
import { requireExampleServer } from "../util";

interface DomWebSocket extends WebSocket {
  dispatchEvent: any;
  removeEventListener: any;
  onclose: any;
  onerror: any;
  onmessage: any;
  onopen: any;
  binaryType: any;
}

describe("The example", () => {
  let operations: string;

  requireExampleServer();

  before(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../../examples/client/operations`
    );
  });

  it("should serve GraphQL subscriptions over web sockets", async () => {
    const socket = new WebSocket(
      "ws://localhost:4999/graphql",
      "graphql-transport-ws"
    ) as DomWebSocket;

    const completed = new DeferredPromise();
    const closed = new DeferredPromise();

    socket.on("close", (code, reason) => {
      closed.resolve([code, reason]);
    });

    const gqlSocket = new GraphQLClientWebSocket({
      socket,
    });

    const results: ExecutionResult<any, any>[] = [];

    await gqlSocket.subscribe(
      {
        query: operations,
        operationName: "NewReviews",
        variables: {
          limit: 2,
        },
      },
      {
        next(result) {
          results.push(result);
        },
        error(errors) {
          completed.reject(
            new Error(errors.map((it) => it.message).join(" / "))
          );
        },
        complete() {
          completed.resolve(undefined);
        },
      }
    );

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

    await completed;

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

    gqlSocket.close();

    assert.deepStrictEqual(await closed, [1000, "Normal Closure"]);
  });
});
