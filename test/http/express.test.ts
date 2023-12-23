import express, { Express } from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { MyContext } from '../../examples/server/src/MyContext';
import { GraphQLServer } from '../../src';
import { bootstrapExample, serverClosed } from '../util';

describe('The GraphQLHttpServer exposed via Express', () => {
  let gqlServer: GraphQLServer<MyContext>;
  let app: Express;
  let server: Server;
  let url: string;

  beforeAll(async () => {
    gqlServer = await bootstrapExample();

    app = express();

    app.get('/graphql', gqlServer.http.expressHandler());
    app.post('/graphql', express.json(), gqlServer.http.expressHandler());

    server = app.listen(0);

    await new Promise((resolve) => server.on('listening', resolve));

    const port = (server.address() as AddressInfo).port;
    url = `http://localhost:${port}/graphql`;
  });

  afterAll(() => {
    if (server) server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be able to handle POST GraphQL requests', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: '{ praise }',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    expect(json).toEqual({
      data: {
        praise: 'the sun!',
      },
    });
  });

  it('should be able to handle GET GraphQL requests', async () => {
    const response = await fetch(`${url}?query={praise}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    expect(json).toEqual({
      data: {
        praise: 'the sun!',
      },
    });
  });

  it('should reject unsupported methods', async () => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ praise }`,
        operationName: 'String',
      }),
    });

    expect(response.status).toBe(404);
  });

  it('should reject mutations via GET', async () => {
    const response = await fetch(`${url}?query=mutation{youDied}`);

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    expect(json).toEqual({
      errors: [{ message: 'Mutations are not allowed via GET' }],
    });
  });

  it('should reject invalid queries', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `{ invalid }`,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    expect(json).toEqual({
      errors: [
        {
          locations: [
            {
              column: 3,
              line: 1,
            },
          ],
          message: 'Cannot query field "invalid" on type "Query".',
        },
      ],
    });
  });

  it('should reject bad requests (e.g. no content-type) with status code 400', async () => {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        query: `{ invalid }`,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    expect(json).toEqual({
      errors: [{ message: 'Invalid query, expected string' }],
    });
  });

  it('should continue with any express middleware queued in after the graphql handler', async () => {
    const postGraphqlHandlerMiddleware = jest.fn();
    const anotherApp = express();

    anotherApp.get(
      '/graphql',
      gqlServer.http.expressHandler(),
      postGraphqlHandlerMiddleware,
    );

    const anotherServer = anotherApp.listen(0);

    await new Promise((resolve) => anotherServer.on('listening', resolve));

    const port = (anotherServer.address() as AddressInfo).port;
    const url = `http://localhost:${port}/graphql`;

    try {
      const response = await fetch(`${url}?query={praise}`);
      expect(response.status).toBe(200);
      expect(postGraphqlHandlerMiddleware).toHaveBeenCalledTimes(1);
    } finally {
      await serverClosed(anotherServer);
    }
  });
});
