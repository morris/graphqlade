import { readdir } from "fs/promises";
import { join } from "path";
import { canImportModule } from "./misc";

export async function watchRecursive(
  dirname: string,
  callback: (filename: string) => unknown
) {
  if (!canImportModule("typescript")) {
    throw new Error(
      "Cannot watch files: Could not import package 'typescript'"
    );
  }

  const ts = await import("typescript");

  if (!ts.sys.watchDirectory || !ts.sys.watchFile) {
    throw new Error(
      "Cannot watch files: ts.sys.watchDirectory/watchFile are undefined"
    );
  }

  ts.sys.watchDirectory(dirname, callback, false);

  for (const entry of await readdir(dirname, { withFileTypes: true })) {
    if (entry.isFile()) {
      ts.sys.watchFile(join(dirname, entry.name), callback);
    } else if (entry.isDirectory()) {
      await watchRecursive(join(dirname, entry.name), callback);
    }
  }
}
