import express, { Express } from 'express';
import * as assert from 'node:assert';
import { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { MyContext } from '../../examples/server/src/MyContext';
import { GraphQLServer } from '../../src';
import { bootstrapExample, serverClosed } from '../util';

describe('The GraphQLHttpServer exposed via Express', () => {
  let gqlServer: GraphQLServer<MyContext>;
  let app: Express;
  let server: Server;
  let url: string;

  before(async () => {
    gqlServer = await bootstrapExample();

    app = express();

    app.get('/graphql', gqlServer.http.expressHandler());
    app.post('/graphql', express.json(), gqlServer.http.expressHandler());

    server = app.listen(0);

    await new Promise((resolve) => server.on('listening', resolve));

    const port = (server.address() as AddressInfo).port;
    url = `http://localhost:${port}/graphql`;
  });

  after(() => {
    if (server) server.close();
  });

  it('should be able to handle POST GraphQL requests', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: '{ praise }',
      }),
    });

    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    assert.deepStrictEqual(json, {
      data: {
        praise: 'the sun!',
      },
    });
  });

  it('should be able to handle GET GraphQL requests', async () => {
    const response = await fetch(`${url}?query={praise}`);

    assert.deepStrictEqual(response.status, 200);
    assert.deepStrictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    assert.deepStrictEqual(json, {
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

    assert.deepStrictEqual(response.status, 404);
  });

  it('should reject mutations via GET', async () => {
    const response = await fetch(`${url}?query=mutation{youDied}`);

    assert.deepStrictEqual(response.status, 400);
    assert.deepStrictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    assert.deepStrictEqual(json, {
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

    assert.deepStrictEqual(response.status, 400);
    assert.deepStrictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    assert.deepStrictEqual(json, {
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

    assert.deepStrictEqual(response.status, 400);
    assert.deepStrictEqual(
      response.headers.get('content-type'),
      'application/json; charset=utf-8',
    );

    const json = await response.json();

    assert.deepStrictEqual(json, {
      errors: [{ message: 'Invalid query, expected string' }],
    });
  });

  it('should continue with any express middleware queued in after the graphql handler', async () => {
    let postGraphqlHandlerCalls = 0;

    const postGraphqlHandlerMiddleware = () => ++postGraphqlHandlerCalls;
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
      assert.deepStrictEqual(response.status, 200);
      assert.deepStrictEqual(postGraphqlHandlerCalls, 1);
    } finally {
      await serverClosed(anotherServer);
    }
  });
});
