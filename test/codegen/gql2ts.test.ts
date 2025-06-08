import assert from 'node:assert';
import * as fs from 'node:fs';
import { describe, it } from 'node:test';
import { gql2ts } from '../../src';
import { requireExampleServer, TestLogger } from '../util';

describe('The gql2ts function', () => {
  const exampleServer = requireExampleServer();

  const scalarTypes = {
    Date: 'string',
    DateTime: 'string',
    Time: 'string',
    UUID: 'string',
    JSON: 'any',
    ESNumber: 'number | string',
  };

  it('should generate server-side code for the example server', async () => {
    const logger = new TestLogger();

    await gql2ts({
      root: 'examples/server',
      server: true,
      noExit: true,
      logger,
    });

    assert.deepStrictEqual(logger.errors, []);
  });

  it('should generate client-code for the example client (using node-fetch)', async () => {
    const { url } = await exampleServer;

    const logger = new TestLogger();

    await gql2ts({
      root: 'examples/client',
      introspection: {
        url,
        async getHeaders() {
          logger.log('got headers');

          return { 'x-test': 'lol' };
        },
      },
      client: true,
      scalarTypes,
      noExit: true,
      logger,
    });

    assert.deepStrictEqual(logger.errors, []);
    assert.deepStrictEqual(logger.logs, ['got headers']);
  });

  it('should generate server-side code with stitching directives', async () => {
    const logger = new TestLogger();

    await gql2ts({
      root: 'examples/server',
      server: true,
      noExit: true,
      stitching: true,
      logger,
    });

    assert.deepStrictEqual(logger.errors, []);
  });

  it('should write an introspection fallback file if the file option is set', async () => {
    const { url } = await exampleServer;

    const logger = new TestLogger();
    const file = 'test/codegen/introspection.json';

    await fs.promises.rm(file).catch(() => 0);

    await gql2ts({
      root: 'examples/client',
      introspection: {
        url,
        file,
      },
      client: true,
      scalarTypes,
      noExit: true,
      logger,
    });

    await fs.promises.readFile(file, 'utf-8');

    await gql2ts({
      root: 'examples/client',
      introspection: {
        url: url + '/use/fallback/instead',
        file,
      },
      client: true,
      scalarTypes,
      noExit: true,
      logger,
    });

    assert.deepStrictEqual(logger.errors, []);
  });
});
