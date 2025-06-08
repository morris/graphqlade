import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { MyContext } from '../../examples/server/src/MyContext';
import { GraphQLServer } from '../../src';
import { bootstrapExample, formatForAssertion } from '../util';

describe('The example server', () => {
  let gqlServer: GraphQLServer<MyContext>;

  before(async () => {
    gqlServer = await bootstrapExample();
  });

  it('should support custom scalar parsing and serialization', async () => {
    const response = await gqlServer.http.execute({
      method: 'POST',
      headers: {},
      body: {
        query: `{
            zero: isFinite(input: 0) { input result }
            one: isFinite(input: 1.0) { input result }
            minusOne: isFinite(input: -1) { input result }
            infinity: isFinite(input: "Infinity") { input result }
            negativeInfinity: isFinite(input: "-Infinity") { input result }
            nan: isFinite(input: "NaN") { input result }
          }`,
      },
    });

    delete response.context;

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 200,
      headers: {},
      body: {
        data: {
          zero: { input: 0, result: true },
          one: { input: 1, result: true },
          minusOne: { input: -1, result: true },
          infinity: { input: 'Infinity', result: false },
          negativeInfinity: { input: '-Infinity', result: false },
          nan: { input: 'NaN', result: false },
        },
      },
    });
  });

  it('should support custom scalar parsing and serialization (2)', async () => {
    const response = await gqlServer.http.execute({
      method: 'POST',
      headers: {},
      body: {
        query: `{
            infinity: divide(dividend: 1 divisor: 0)
            negativeInfinity: divide(dividend: -1 divisor: 0)
          }`,
      },
    });

    delete response.context;

    assert.deepStrictEqual(formatForAssertion(response), {
      status: 200,
      headers: {},
      body: {
        data: {
          infinity: 'Infinity',
          negativeInfinity: '-Infinity',
        },
      },
    });
  });
});
