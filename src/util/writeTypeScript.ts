import { promises as fsPromises } from "fs";
import { dirname } from "path";
import { canImportModule } from "./canImportModule";

const { mkdir, writeFile } = fsPromises;

export async function writeTypeScript(filename: string, code: string) {
  let output = code;

  if (await canImportModule("prettier")) {
    const { format, resolveConfig } = await import("prettier");

    const prettierConfig = await resolveConfig(filename);
    output = await format(code, {
      ...prettierConfig,
      parser: "typescript",
    });
  }

  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, output);
}
