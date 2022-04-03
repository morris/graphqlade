import WebSocket from "ws";
import { GraphQLWebSocketClient, WebSocketLike } from "../../src";
import { requireExampleServer, sleep } from "../util";

describe("The GraphQLWebSocketClient", () => {
  requireExampleServer();

  const url = "ws://localhost:4999/graphql";

  function createWebSocket(url: string, protocol: string) {
    return new WebSocket(url, protocol) as unknown as WebSocketLike;
  }

  it("should be able to cancel subscriptions client-side (return)", async () => {
    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ["MASTER_KEY"],
      },
    });

    const iterator = client.subscribe({
      query: `subscription {
        newReview(limit: 10) {
          id
        }
      }`,
    });

    const results: unknown[] = [];

    const complete = (async () => {
      for await (const result of iterator) {
        results.push(result);
      }
    })();

    await sleep(300);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = client.graphqlSocket?.socket as any;
    expect(socket).toBeDefined();

    const messages: Record<string, unknown>[] = [];
    const originalSend = socket.send;
    socket.send = function (message: string) {
      messages.push(JSON.parse(message));
      return originalSend.call(this, message);
    };

    iterator.return();

    await complete;

    expect(messages).toEqual([{ type: "complete", id: "1" }]);
    expect(results).toEqual([]);

    client.close();
  });
});
