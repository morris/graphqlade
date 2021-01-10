import { Stats, Dirent, promises as fsPromises } from "fs";
import { join } from "path";
import { canImportModule } from "./canImportModule";
import { LoggerLike } from "./logging";

const { readdir, stat } = fsPromises;

export async function watchRecursive(
  dirname: string,
  callback: (path: string) => unknown,
  logger?: LoggerLike
) {
  const _logger = logger ?? console;
  const { watchDirectory, watchFile } = await importWatchFunctions();

  watchDirectory(
    dirname,
    async (path) => {
      try {
        const stats = await stat(path);
        await watchFileOrDirectory(path, stats, callback);
      } catch (err) {
        _logger.warn(err.stack);
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
    callback: (path: string) => unknown
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
