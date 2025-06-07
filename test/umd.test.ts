import fs from 'fs';

describe('The UMD build', () => {
  it('should work with require()', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const graphqlade = require('../dist/graphqlade.umd.js');

    expect(typeof graphqlade.GraphQLClientWebSocket).toEqual('function');
    expect(typeof graphqlade.GraphQLWebSocketClient).toEqual('function');
  });

  it('should work with dynamic import', async () => {
    // @ts-expect-error: No typings
    const graphqlade = await import('../dist/graphqlade.umd.js');

    expect(typeof graphqlade.GraphQLClientWebSocket).toEqual('function');
    expect(typeof graphqlade.GraphQLWebSocketClient).toEqual('function');
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

    expect(typeof exports).toEqual('undefined');
    expect(typeof graphqlade.GraphQLClientWebSocket).toEqual('function');
    expect(typeof graphqlade.GraphQLWebSocketClient).toEqual('function');
  });
});
