import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { canImportModule } from "./misc";

export async function writeTypeScript(filename: string, code: string) {
  let output = code;

  if (await canImportModule("prettier")) {
    const { format, resolveConfig } = await import("prettier");

    const prettierConfig = await resolveConfig(filename);
    output = format(code, {
      ...prettierConfig,
      parser: "typescript",
    });
  }

  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, output);
}
