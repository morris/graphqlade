import * as assert from "assert";
import got from "got";
import { ExecutionResult } from "graphql";
import WebSocket from "ws";
import { GraphQLReader, GraphQLWebSocketClient } from "../../src";
import { requireExampleServer, wsClosed } from "../util";

describe("The example (ws)", () => {
  let operations: string;

  requireExampleServer();

  before(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../../examples/client/operations`
    );
  });

  it("should close a socket with invalid an protocol immediately", async () => {
    const socket = new WebSocket("ws://localhost:4999/graphql", "foo-bar-baz");

    assert.deepStrictEqual(await wsClosed(socket), [
      1002,
      "Unsupported web socket protocol foo-bar-baz",
    ]);
  });

  it("should close a socket when not receiving a connection_init message in time", async () => {
    const socket = new WebSocket(
      "ws://localhost:4999/graphql",
      "graphql-transport-ws"
    );

    assert.deepStrictEqual(await wsClosed(socket), [
      4408,
      "Connection initialization timeout",
    ]);
  });

  it("should close a socket immediately on receiving more than one connection_init message", async () => {
    const socket = new WebSocket(
      "ws://localhost:4999/graphql",
      "graphql-transport-ws"
    );

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "connection_init",
          payload: { keys: ["MASTER_KEY"] },
        })
      );
      socket.send(
        JSON.stringify({
          type: "connection_init",
          payload: { keys: ["BRUTE_FORCE"] },
        })
      );
    });

    assert.deepStrictEqual(await wsClosed(socket), [
      4429,
      "Too many initialization requests",
    ]);
  });

  it("should close a socket immediately on receiving invalid message types", async () => {
    const socket = new WebSocket(
      "ws://localhost:4999/graphql",
      "graphql-transport-ws"
    );

    socket.on("open", () => {
      socket.send(JSON.stringify({ type: "hello" }));
    });

    assert.deepStrictEqual(await wsClosed(socket), [
      4400,
      "Invalid message type: hello",
    ]);
  });

  it("should close a socket immediately if it is not acknowledged", async () => {
    const client = new GraphQLWebSocketClient({
      url: "ws://localhost:4999/graphql",
      createWebSocket(url, protocol) {
        return new WebSocket(url, protocol);
      },
      connectionInitPayload: {
        thief: true,
      },
    });

    try {
      await client.requireConnection();
      assert.ok(false, "should not have connected");
    } catch (err) {
      assert.strictEqual(err.message, "Unauthorized: It appears to be locked");
    }
  });

  it("should reject invalid operations with an error message", async () => {
    const client = new GraphQLWebSocketClient({
      url: "ws://localhost:4999/graphql",
      createWebSocket(url, protocol) {
        return new WebSocket(url, protocol);
      },
      connectionInitPayload: {
        keys: ["MASTER_KEY"],
      },
    });

    try {
      for await (const result of client.subscribe({
        query: `subscription DoesNotExist {
          hello
        }`,
      })) {
        assert.ok(result);
      }

      assert.ok(false, "should have thrown");
    } catch (err) {
      assert.strictEqual(
        err.message,
        'Subscription error: Cannot query field "hello" on type "Subscription".'
      );
    }

    client.close();
  });

  it("should serve GraphQL subscriptions over web sockets", async () => {
    const client = new GraphQLWebSocketClient({
      url: "ws://localhost:4999/graphql",
      createWebSocket(url, protocol) {
        return new WebSocket(url, protocol);
      },
      connectionInitPayload: {
        keys: ["MASTER_KEY"],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: ExecutionResult<any, any>[] = [];

    const iterator = client.subscribe<ExecutionResult>({
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

    assert.deepStrictEqual(
      await wsClosed(client.graphqlSocket?.socket as WebSocket),
      [1000, "Normal Closure"]
    );

    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        data: {
          newReview: {
            ...it.data?.newReview,
            createdAt: "test",
            id: "test",
          },
        },
      })),
      [
        {
          data: {
            newReview: {
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
            newReview: {
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

  it("should reconnect on non-error closures", async () => {
    const client = new GraphQLWebSocketClient({
      url: "ws://localhost:4999/graphql",
      createWebSocket(url, protocol) {
        return new WebSocket(url, protocol);
      },
      connectionInitPayload: {
        keys: ["MASTER_KEY"],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: ExecutionResult<any, any>[] = [];

    const iterator = client.subscribe<ExecutionResult>({
      query: operations,
      operationName: "NewReviews",
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

    client.graphqlSocket?.socket.close(1000);

    await new Promise((resolve) => setTimeout(resolve, 800));

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

    client.close();

    await complete;

    assert.deepStrictEqual(
      await wsClosed(client.graphqlSocket?.socket as WebSocket),
      [1000, "Normal Closure"]
    );

    assert.strictEqual(results.length, 2);
    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        data: {
          newReview: {
            ...it.data?.newReview,
            createdAt: "test",
            id: "test",
          },
        },
      })),
      //
      [
        {
          data: {
            newReview: {
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
            newReview: {
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
