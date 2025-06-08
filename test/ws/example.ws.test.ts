import { ExecutionResult } from 'graphql';
import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import WebSocket from 'ws';
import {
  GraphQLReader,
  GraphQLWebSocketClient,
  WebSocketLike,
} from '../../src';
import { requireExampleServer, sleep, wsClosed } from '../util';

describe('The example (ws)', () => {
  let operations: string;

  const exampleServer = requireExampleServer();

  function createWebSocket(url: string, protocol: string): WebSocketLike {
    return new WebSocket(url, protocol) as unknown as WebSocketLike;
  }

  before(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../../examples/client/operations`,
    );
  });

  it('should close a socket with invalid an protocol immediately', async () => {
    const { wsUrl: url } = await exampleServer;

    const socket = new WebSocket(url, 'foo-bar-baz');

    assert.deepStrictEqual(await wsClosed(socket), [
      1002,
      'Unsupported web socket protocol foo-bar-baz',
    ]);
  });

  it('should close a socket when not receiving a connection_init message in time', async () => {
    const { wsUrl: url } = await exampleServer;

    const socket = new WebSocket(url, 'graphql-transport-ws');

    assert.deepStrictEqual(await wsClosed(socket), [
      4408,
      'Connection initialization timeout',
    ]);
  });

  it('should close a socket immediately on receiving more than one connection_init message', async () => {
    const { wsUrl: url } = await exampleServer;

    const socket = new WebSocket(url, 'graphql-transport-ws');

    socket.on('open', () => {
      socket.send(
        JSON.stringify({
          type: 'connection_init',
          payload: { keys: ['MASTER_KEY'] },
        }),
      );
      socket.send(
        JSON.stringify({
          type: 'connection_init',
          payload: { keys: ['BRUTE_FORCE'] },
        }),
      );
    });

    assert.deepStrictEqual(await wsClosed(socket), [
      4429,
      'Too many initialization requests',
    ]);
  });

  it('should close a socket immediately on receiving invalid message types', async () => {
    const { wsUrl: url } = await exampleServer;

    const socket = new WebSocket(url, 'graphql-transport-ws');

    socket.on('open', () => {
      socket.send(JSON.stringify({ type: 'hello' }));
    });

    assert.deepStrictEqual(await wsClosed(socket), [
      4400,
      'Invalid message type: hello',
    ]);
  });

  it('should close a socket immediately if it is not acknowledged', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        thief: true,
      },
    });

    await assert.rejects(
      client.requireConnection(),
      new Error('Unauthorized: It appears to be locked'),
    );

    client.close();
  });

  it('should reject invalid operations with an error message', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
      },
    });

    await assert.rejects(
      (async () => {
        for await (const result of client.subscribe({
          query: `subscription DoesNotExist {
            hello
          }`,
        })) {
          assert.ok(result);
        }
      })(),
      new Error(
        'Subscription error: Cannot query field "hello" on type "Subscription".',
      ),
    );

    client.close();
  });

  it('should serve GraphQL subscriptions over web sockets', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: ExecutionResult<any, any>[] = [];

    const iterator = client.subscribe<ExecutionResult>({
      query: operations,
      operationName: 'NewReviews',
      variables: {
        limit: 2,
      },
    });

    const complete = (async () => {
      for await (const result of iterator) {
        results.push(result);
      }
    })();

    await sleep(300);

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'CreateBossReview',
        variables: {
          input: {
            author: 'tester',
            bossId: '1',
            difficulty: 'IMPOSSIBLE',
            theme: 'ALRIGHT',
          },
        },
      }),
    }).then((response) => response.json());

    await sleep(300);

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'CreateLocationReview',
        variables: {
          input: {
            author: 'tester',
            locationId: '13',
            difficulty: 'HARD',
            design: 'STELLAR',
          },
        },
      }),
    }).then((response) => response.json());

    await sleep(300);

    await complete;

    client.close();

    assert.deepStrictEqual(
      await wsClosed(client.graphqlSocket?.socket as unknown as WebSocket),
      [1000, 'Normal Closure'],
    );

    assert.deepStrictEqual(results.length, 2);

    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        data: {
          newReview: {
            ...it.data?.newReview,
            createdAt: 'test',
            id: 'test',
          },
        },
      })),
      [
        {
          data: {
            newReview: {
              __typename: 'BossReview',
              author: 'tester',
              boss: {
                id: '1',
                name: 'Asylum Demon',
              },
              createdAt: 'test',
              difficulty: 'IMPOSSIBLE',
              id: 'test',
              theme: 'ALRIGHT',
            },
          },
        },
        {
          data: {
            newReview: {
              __typename: 'LocationReview',
              author: 'tester',
              location: {
                id: '13',
                name: 'Undead Parish',
              },
              createdAt: 'test',
              difficulty: 'HARD',
              id: 'test',
              design: 'STELLAR',
            },
          },
        },
      ],
    );
  });

  it('should serve GraphQL subscriptions over web sockets (async w/ callbacks)', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = [];
    const errors: Error[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stop = client.subscribeAsync<any>(
      {
        query: operations,
        operationName: 'NewReviews',
      },
      {
        onData(data) {
          results.push(data);
        },
        onError(err) {
          errors.push(err);
        },
      },
    );

    await sleep(300);

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'CreateBossReview',
        variables: {
          input: {
            author: 'tester',
            bossId: '1',
            difficulty: 'IMPOSSIBLE',
            theme: 'ALRIGHT',
          },
        },
      }),
    }).then((response) => response.json());

    await sleep(300);

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'CreateLocationReview',
        variables: {
          input: {
            author: 'tester',
            locationId: '13',
            difficulty: 'HARD',
            design: 'STELLAR',
          },
        },
      }),
    }).then((response) => response.json());

    await sleep(300);

    stop();

    client.close();

    assert.deepStrictEqual(
      await wsClosed(client.graphqlSocket?.socket as unknown as WebSocket),
      [1000, 'Normal Closure'],
    );

    assert.deepStrictEqual(errors, []);
    assert.deepStrictEqual(results.length, 2);

    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        newReview: {
          ...it.newReview,
          createdAt: 'test',
          id: 'test',
        },
      })),
      [
        {
          newReview: {
            __typename: 'BossReview',
            author: 'tester',
            boss: {
              id: '1',
              name: 'Asylum Demon',
            },
            createdAt: 'test',
            difficulty: 'IMPOSSIBLE',
            id: 'test',
            theme: 'ALRIGHT',
          },
        },
        {
          newReview: {
            __typename: 'LocationReview',
            author: 'tester',
            location: {
              id: '13',
              name: 'Undead Parish',
            },
            createdAt: 'test',
            difficulty: 'HARD',
            id: 'test',
            design: 'STELLAR',
          },
        },
      ],
    );
  });

  it('should reconnect on non-error closures', async () => {
    const { url } = await exampleServer;

    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: ExecutionResult<any, any>[] = [];

    const iterator = client.subscribe<ExecutionResult>({
      query: operations,
      operationName: 'NewReviews',
    });

    const complete = (async () => {
      for await (const result of iterator) {
        results.push(result);
      }
    })();

    await sleep(300);

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'CreateBossReview',
        variables: {
          input: {
            author: 'tester',
            bossId: '1',
            difficulty: 'IMPOSSIBLE',
            theme: 'ALRIGHT',
          },
        },
      }),
    }).then((response) => response.json());

    await sleep(300);

    client.graphqlSocket?.socket.close(1000);

    await sleep(800);

    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: operations,
        operationName: 'CreateLocationReview',
        variables: {
          input: {
            author: 'tester',
            locationId: '13',
            difficulty: 'HARD',
            design: 'STELLAR',
          },
        },
      }),
    }).then((response) => response.json());

    await sleep(300);

    client.close();

    await complete;

    assert.deepStrictEqual(
      await wsClosed(client.graphqlSocket?.socket as unknown as WebSocket),
      [1000, 'Normal Closure'],
    );

    assert.deepStrictEqual(results.length, 2);

    assert.deepStrictEqual(
      results.map((it) => ({
        ...it,
        data: {
          newReview: {
            ...it.data?.newReview,
            createdAt: 'test',
            id: 'test',
          },
        },
      })),
      [
        {
          data: {
            newReview: {
              __typename: 'BossReview',
              author: 'tester',
              boss: {
                id: '1',
                name: 'Asylum Demon',
              },
              createdAt: 'test',
              difficulty: 'IMPOSSIBLE',
              id: 'test',
              theme: 'ALRIGHT',
            },
          },
        },
        {
          data: {
            newReview: {
              __typename: 'LocationReview',
              author: 'tester',
              location: {
                id: '13',
                name: 'Undead Parish',
              },
              createdAt: 'test',
              difficulty: 'HARD',
              id: 'test',
              design: 'STELLAR',
            },
          },
        },
      ],
    );
  });
});
