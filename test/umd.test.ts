import * as assert from 'node:assert';
import * as fs from 'node:fs';
import { describe, it } from 'node:test';

describe('The UMD build', () => {
  it('should work with require()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const graphqlade = require('../dist/graphqlade.umd.js');

    assert.strictEqual(typeof graphqlade.GraphQLClientWebSocket, 'function');
    assert.strictEqual(typeof graphqlade.GraphQLWebSocketClient, 'function');
  });

  it('should work with dynamic import', async () => {
    // @ts-expect-error: No typings
    const graphqlade = await import('../dist/graphqlade.umd.js');

    assert.strictEqual(typeof graphqlade.GraphQLClientWebSocket, 'function');
    assert.strictEqual(typeof graphqlade.GraphQLWebSocketClient, 'function');
  });

  it('should work as a global script (global self)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self: any = {};

    const exports = undefined;

    eval(
      await fs.promises.readFile(
        `${__dirname}/../dist/graphqlade.umd.js`,
        'utf-8',
      ),
    );

    const { graphqlade } = self;

    assert.strictEqual(typeof exports, 'undefined');
    assert.strictEqual(typeof graphqlade.GraphQLClientWebSocket, 'function');
    assert.strictEqual(typeof graphqlade.GraphQLWebSocketClient, 'function');
  });
});
