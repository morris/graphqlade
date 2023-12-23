import { GraphQLSchema, buildSchema } from 'graphql';
import * as http from 'http';
import * as ws from 'ws';
import {
  AsyncPushIterator,
  GraphQLWebSocketClient,
  GraphQLWebSocketServer,
  listen,
} from '../../src';
import { serverClosed } from '../util';

describe('The GraphQLWebSocketServer', () => {
  let schema: GraphQLSchema;
  let server: http.Server;
  let url: string;

  beforeAll(async () => {
    schema = buildSchema(`
      type Query {
        hello: String
      }

      type Subscription {
        counter: Int
      }
    `);

    const fields = schema.getSubscriptionType()?.getFields() ?? {};

    fields.counter.subscribe = (_, args, context) => {
      if (!context.authorization) {
        throw new Error('Missing authorization');
      }

      if (context.authorization !== 'it me') {
        throw new Error('Unauthorized');
      }

      return new AsyncPushIterator((iterator) => {
        let counter = 0;

        const interval = setInterval(
          () => iterator.push({ counter: ++counter }),
          500,
        );

        return () => clearInterval(interval);
      });
    };

    server = http.createServer(() => {
      // ignore
    });

    const port = await listen(server);
    url = `http://localhost:${port}/graphql`;
  });

  afterAll(async () => {
    await serverClosed(server);
  });

  it('should work', async () => {
    const gqlWsServer = new GraphQLWebSocketServer({
      schema,
      createContext({ connectionInitPayload }) {
        return connectionInitPayload;
      },
    });

    const wsServer = new ws.Server({
      server,
      path: '/graphql',
    });

    wsServer.on('connection', gqlWsServer.connectionHandler());

    const counters: number[] = [];

    const gqlWsClient = new GraphQLWebSocketClient({
      url,
      connectionInitPayload: {
        authorization: 'it me',
      },
      createWebSocket(url, protocol) {
        return new ws.WebSocket(url, protocol) as unknown as WebSocket;
      },
    });

    try {
      for await (const result of gqlWsClient.subscribe<{ counter: number }>({
        query: `subscription { counter }`,
      })) {
        if (!result.data) throw new Error('No data');

        counters.push(result.data.counter);

        if (counters.length >= 3) break;
      }
    } finally {
      wsServer.close();
      gqlWsClient.close();
    }

    expect(counters).toEqual([1, 2, 3]);
  });
});
