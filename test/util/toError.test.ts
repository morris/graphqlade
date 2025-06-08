import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { toError } from '../../src';

describe('toError', () => {
  it('should return Error instances as-is', () => {
    const input = [
      new Error('a'),
      new TypeError('b'),
      new assert.AssertionError({ message: 'c' }),
    ];

    assert.deepStrictEqual(input.map(toError), input);
  });

  it('should wrap non-error values with an Error instance', () => {
    const input = [undefined, null, 'a', 2, { foo: 'bar' }, []];

    assert.deepStrictEqual(input.map(toError), [
      new Error('Unknown error: undefined'),
      new Error('Unknown error: null'),
      new Error('Unknown error: "a"'),
      new Error('Unknown error: 2'),
      new Error('Unknown error: {"foo":"bar"}'),
      new Error('Unknown error: []'),
    ]);
  });
});
