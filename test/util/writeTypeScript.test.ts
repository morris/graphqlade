import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { describe, it } from 'node:test';
import { writeTypeScript } from '../../src';

describe('The writeTypeScript function', () => {
  it('should write TypeScript files (prettified)', async () => {
    await writeTypeScript(
      'test/util/writeTypeScript/actual.txt',
      `
        const hello = 'world';
        if( true )console.log("bar");
      `,
    );

    const actual = await fs.readFile(
      'test/util/writeTypeScript/actual.txt',
      'utf-8',
    );

    assert.strictEqual(
      actual,
      "const hello = 'world';\nif (true) console.log('bar');\n",
    );
  });
});
