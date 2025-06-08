import { ExecutionResult } from 'graphql';
import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import WebSocket from 'ws';
import {
  DNewReviews,
  typings,
} from '../../examples/client/src/generated/operations';
import { GraphQLWebSocketClient, WebSocketLike } from '../../src';
import { requireExampleServer, sleep } from '../util';

describe('The GraphQLWebSocketClient', () => {
  const exampleServer = requireExampleServer();

  function createWebSocket(url: string, protocol: string) {
    return new WebSocket(url, protocol) as unknown as WebSocketLike;
  }

  it('should be able to cancel subscriptions client-side (return)', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
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
    assert.ok(socket);

    const messages: Record<string, unknown>[] = [];
    const originalSend = socket.send;
    socket.send = function (message: string) {
      messages.push(JSON.parse(message));
      return originalSend.call(this, message);
    };

    iterator.return();

    await complete;

    assert.deepStrictEqual(messages, [{ type: 'complete', id: '1' }]);
    assert.deepStrictEqual(results, []);

    client.close();
  });

  it('should be able to use typings', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      typings,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
      },
    });

    const iterator = client.subscribeNamed('NewReviews', { limit: 10 });

    const results: ExecutionResult<DNewReviews>[] = [];

    const complete = (async () => {
      for await (const result of iterator) {
        results.push(result);
        assert.ok(result.data?.newReview?.author);
      }
    })();

    await sleep(300);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = client.graphqlSocket?.socket as any;
    assert.ok(socket);

    iterator.return();

    await complete;

    assert.deepStrictEqual(results, []);

    client.close();
  });
});
