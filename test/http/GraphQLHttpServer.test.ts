import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { MyContext } from '../../examples/server/src/MyContext';
import { GraphQLServer } from '../../src';
import { bootstrapExample, formatForAssertion } from '../util';

describe('The GraphQLHttpServer', () => {
  let gqlServer: GraphQLServer<MyContext>;

  before(async () => {
    gqlServer = await bootstrapExample();
  });

  it('should be able to handle POST GraphQL requests', async () => {
    const response = await gqlServer.http.execute({
      method: 'POST',
      headers: {},
      body: {
        query: '{ praise }',
      },
    });

    delete response.context;

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 200,
      headers: {},
      body: {
        data: {
          praise: 'the sun!',
        },
      },
    });
  });

  it('should be able to handle GET GraphQL requests', async () => {
    const response = await gqlServer.http.execute({
      method: 'GET',
      headers: {},
      query: {
        query: `{ praise }`,
      },
    });

    // test query caching
    await gqlServer.http.execute({
      method: 'GET',
      headers: {},
      query: {
        query: `{ praise }`,
      },
    });

    delete response.context;

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 200,
      headers: {},
      body: {
        data: {
          praise: 'the sun!',
        },
      },
    });
  });

  it('should reject unsupported methods', async () => {
    const response = await gqlServer.http.execute({
      method: 'PUT',
      headers: {},
      body: {
        query: `{ praise }`,
        operationName: 'String',
      },
    });

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 405,
      headers: {},
      body: {
        errors: [{ message: 'Unsupported method: PUT' }],
      },
    });
  });

  it('should reject mutations via GET', async () => {
    const response = await gqlServer.http.execute({
      method: 'GET',
      headers: {},
      query: {
        query: 'mutation Test { youDied }',
        operationName: 'Test',
      },
    });

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 400,
      headers: {},
      body: {
        errors: [{ message: 'Mutations are not allowed via GET' }],
      },
    });
  });

  it('should reject invalid queries', async () => {
    const response = await gqlServer.http.execute({
      method: 'POST',
      headers: {},
      body: {
        query: `{ invalid }`,
      },
    });

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 400,
      headers: {},
      body: {
        errors: [{ message: 'Cannot query field "invalid" on type "Query".' }],
      },
    });
  });
});
