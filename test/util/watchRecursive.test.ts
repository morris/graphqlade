import { mkdirSync, rmdirSync, writeFileSync } from 'fs';
import assert from 'node:assert';
import test from 'node:test';
import { join, normalize } from 'path';
import { GraphQLReader, watchRecursive } from '../../src';
import { TestLogger } from '../util';

test.describe('The watchRecursive function', () => {
  test.before(async () => {
    try {
      rmdirSync(join(__dirname, 'watchRecursive'), { recursive: true });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // ignore
    }

    mkdirSync(join(__dirname, 'watchRecursive'), { recursive: true });
  });

  test('should watch directories recursively', async () => {
    const callbacks: string[] = [];
    const logger = new TestLogger();

    const stop = await watchRecursive({
      dirname: join(__dirname, 'watchRecursive'),
      callback: (path) => callbacks.push(path),
      match: (path, stats) =>
        stats.isDirectory() || new GraphQLReader().isGraphQLFile(path),
      logger,
    });

    mkdirSync(join(__dirname, 'watchRecursive/foo'), { recursive: true });
    mkdirSync(join(__dirname, 'watchRecursive/bar'), { recursive: true });
    writeFileSync(join(__dirname, 'watchRecursive/test.graphql'), '');

    await new Promise((resolve) => setTimeout(resolve, 100));

    mkdirSync(join(__dirname, 'watchRecursive/foo/baz'));
    writeFileSync(join(__dirname, 'watchRecursive/foo/test.gql'), '');
    writeFileSync(join(__dirname, 'watchRecursive/foo/baz/test.txt'), '');

    await new Promise((resolve) => setTimeout(resolve, 100));

    writeFileSync(join(__dirname, 'watchRecursive/test.graphql'), '');
    writeFileSync(join(__dirname, 'watchRecursive/foo/test.gql'), '');

    await new Promise((resolve) => setTimeout(resolve, 100));

    rmdirSync(join(__dirname, 'watchRecursive/foo'), { recursive: true });

    await new Promise((resolve) => setTimeout(resolve, 100));

    stop();

    writeFileSync(join(__dirname, 'watchRecursive/late.gql'), '');

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (process.env.CI) {
      // watching may work differently in CI
      // only do a basic check
      assert(callbacks.length > 10);
      return;
    }

    assert.deepStrictEqual(
      Array.from(new Set(callbacks))
        .sort()
        .map((it) => normalize(it)),
      [
        '/watchRecursive/bar',
        '/watchRecursive/foo',
        '/watchRecursive/foo/baz',
        '/watchRecursive/foo/baz/test.txt',
        '/watchRecursive/foo/test.gql',
        '/watchRecursive/test.graphql',
      ].map((it) => normalize(join(__dirname, it))),
    );
  });
});
