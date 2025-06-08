import KoaRouter from '@koa/router';
import { Server } from 'http';
import Koa from 'koa';
import KoaBodyParser from 'koa-bodyparser';
import * as assert from 'node:assert';
import { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';
import { MyContext } from '../../examples/server/src/MyContext';
import { GraphQLServer } from '../../src';
import { bootstrapExample, serverClosed } from '../util';

describe('The GraphQLHttpServer exposed via Koa', () => {
  const router = new KoaRouter();

  let gqlServer: GraphQLServer<MyContext>;
  let app: Koa;
  let server: Server;
  let url: string;

  before(async () => {
    gqlServer = await bootstrapExample();

    app = new Koa();

    router.get('/graphql', gqlServer.http.koaHandler());
    router.post('/graphql', KoaBodyParser(), gqlServer.http.koaHandler());

    app.use(router.allowedMethods()).use(router.routes());

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
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer of a ring',
      },
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

    assert.deepStrictEqual(response.status, 405);

    const text = await response.text();

    assert.deepStrictEqual(text, 'Method Not Allowed');
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

  it('should respect koa middleware queued in after the graphql handler', async () => {
    let postHandlerCalls = 0;

    const postGraphqlHandlerMiddleware = () => ++postHandlerCalls;

    const appWithAdditionalMiddleware: Koa = new Koa();
    appWithAdditionalMiddleware
      .use(router.allowedMethods())
      .use(router.routes());
    appWithAdditionalMiddleware.use(postGraphqlHandlerMiddleware);
    const anotherServer = appWithAdditionalMiddleware.listen(0);

    await new Promise((resolve) => anotherServer.on('listening', resolve));

    const port = (anotherServer.address() as AddressInfo).port;
    const url = `http://localhost:${port}/graphql`;

    try {
      const response = await fetch(`${url}?query={praise}`);
      assert.deepStrictEqual(response.status, 200);
      assert.deepStrictEqual(postHandlerCalls, 1);
    } finally {
      await serverClosed(anotherServer);
    }
  });
});
