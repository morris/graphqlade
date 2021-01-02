import { Stats, Dirent, promises as fsPromises } from "fs";
import { join } from "path";
import { canImportModule } from "./canImportModule";

const { readdir, stat } = fsPromises;

export async function watchRecursive(
  dirname: string,
  callback: (filename: string) => unknown
) {
  const { watchDirectory, watchFile } = await importWatchFunctions();

  watchDirectory(
    dirname,
    async (filename) => {
      const path = join(dirname, filename);
      const stats = await stat(path);

      try {
        await watchFileOrDirectory(path, stats, callback);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(err.stack);
      }

      callback(path);
    },
    false
  );

  for (const entry of await readdir(dirname, { withFileTypes: true })) {
    await watchFileOrDirectory(join(dirname, entry.name), entry, callback);
  }

  async function watchFileOrDirectory(
    path: string,
    stats: Stats | Dirent,
    callback: (filename: string) => unknown
  ) {
    if (stats.isFile()) {
      watchFile(path, () => callback(path));
    } else if (stats.isDirectory()) {
      await watchRecursive(path, callback);
    }
  }
}

export async function importWatchFunctions() {
  if (!canImportModule("typescript")) {
    throw new Error(
      "Cannot watch files: Could not import package 'typescript'"
    );
  }

  const ts = await import("typescript");
  const { watchDirectory, watchFile } = ts.sys;

  if (!watchDirectory || !watchFile) {
    throw new Error(
      "Cannot watch files: ts.sys.watchDirectory/watchFile are undefined"
    );
  }

  return { watchDirectory, watchFile };
}
