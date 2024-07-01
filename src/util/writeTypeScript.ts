import { promises as fsPromises } from 'fs';
import { dirname } from 'path';

const { mkdir, writeFile } = fsPromises;

export async function writeTypeScript(filename: string, code: string) {
  let output = code;

  const prettier = await import('prettier').catch(() => undefined);

  if (prettier) {
    const prettierConfig = await prettier.resolveConfig(filename);
    output = await prettier.format(code, {
      ...prettierConfig,
      parser: 'typescript',
    });
  }

  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, output);
}
