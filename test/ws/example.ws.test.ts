import { ExecutionResult } from 'graphql';
import WebSocket from 'ws';
import {
  GraphQLReader,
  GraphQLWebSocketClient,
  WebSocketLike,
} from '../../src';
import { requireExampleServer, sleep, wsClosed } from '../util';

describe('The example (ws)', () => {
  let operations: string;

  requireExampleServer();

  const url = 'ws://localhost:4999/graphql';

  function createWebSocket(url: string, protocol: string): WebSocketLike {
    return new WebSocket(url, protocol) as unknown as WebSocketLike;
  }

  beforeAll(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../../examples/client/operations`,
    );
  });

  it('should close a socket with invalid an protocol immediately', async () => {
    const socket = new WebSocket(url, 'foo-bar-baz');

    expect(await wsClosed(socket)).toEqual([
      1002,
      'Unsupported web socket protocol foo-bar-baz',
    ]);
  });

  it('should close a socket when not receiving a connection_init message in time', async () => {
    const socket = new WebSocket(url, 'graphql-transport-ws');

    expect(await wsClosed(socket)).toEqual([
      4408,
      'Connection initialization timeout',
    ]);
  });

  it('should close a socket immediately on receiving more than one connection_init message', async () => {
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

    expect(await wsClosed(socket)).toEqual([
      4429,
      'Too many initialization requests',
    ]);
  });

  it('should close a socket immediately on receiving invalid message types', async () => {
    const socket = new WebSocket(url, 'graphql-transport-ws');

    socket.on('open', () => {
      socket.send(JSON.stringify({ type: 'hello' }));
    });

    expect(await wsClosed(socket)).toEqual([
      4400,
      'Invalid message type: hello',
    ]);
  });

  it('should close a socket immediately if it is not acknowledged', async () => {
    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        thief: true,
      },
    });

    await expect(client.requireConnection()).rejects.toThrowError(
      'Unauthorized: It appears to be locked',
    );

    client.close();
  });

  it('should reject invalid operations with an error message', async () => {
    const client = new GraphQLWebSocketClient({
      url,
      createWebSocket,
      connectionInitPayload: {
        keys: ['MASTER_KEY'],
      },
    });

    await expect(
      (async () => {
        for await (const result of client.subscribe({
          query: `subscription DoesNotExist {
            hello
          }`,
        })) {
          expect(result).toBeDefined();
        }
      })(),
    ).rejects.toThrow(
      'Subscription error: Cannot query field "hello" on type "Subscription".',
    );

    client.close();
  });

  it('should serve GraphQL subscriptions over web sockets', async () => {
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

    await fetch('http://localhost:4999/graphql', {
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

    await fetch('http://localhost:4999/graphql', {
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

    expect(
      await wsClosed(client.graphqlSocket?.socket as unknown as WebSocket),
    ).toEqual([1000, 'Normal Closure']);

    expect(results.length).toEqual(2);

    expect(
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
    ).toEqual([
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
    ]);
  });

  it('should serve GraphQL subscriptions over web sockets (async w/ callbacks)', async () => {
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

    await fetch('http://localhost:4999/graphql', {
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

    await fetch('http://localhost:4999/graphql', {
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

    expect(
      await wsClosed(client.graphqlSocket?.socket as unknown as WebSocket),
    ).toEqual([1000, 'Normal Closure']);

    expect(errors).toEqual([]);
    expect(results.length).toEqual(2);

    expect(
      results.map((it) => ({
        ...it,
        newReview: {
          ...it.newReview,
          createdAt: 'test',
          id: 'test',
        },
      })),
    ).toEqual([
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
    ]);
  });

  it('should reconnect on non-error closures', async () => {
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

    await fetch('http://localhost:4999/graphql', {
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

    await fetch('http://localhost:4999/graphql', {
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

    expect(
      await wsClosed(client.graphqlSocket?.socket as unknown as WebSocket),
    ).toEqual([1000, 'Normal Closure']);

    expect(results.length).toEqual(2);

    expect(
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
    ).toEqual([
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
    ]);
  });
});
