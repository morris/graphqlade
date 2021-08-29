import { Stats, Dirent, promises as fsPromises } from "fs";
import { join } from "path";
import type { FileWatcher } from "typescript";
import { canImportModule } from "./canImportModule";
import { LoggerLike } from "./logging";
import { toError } from "./toError";

const { readdir, stat } = fsPromises;

// TODO the watchers set actually leaks memory (non-critical for now)

export interface WatchRecursiveOptions {
  dirname: string;
  callback: (path: string) => unknown;
  match?: (path: string, stats: Stats | Dirent) => boolean;
  logger?: LoggerLike;
  watchers?: Set<FileWatcher>;
}

export async function watchRecursive(options: WatchRecursiveOptions) {
  const {
    dirname,
    callback,
    match,
    logger = console,
    watchers = new Set(),
  } = options;

  const { watchDirectory, watchFile } = await importWatchFunctions();

  watchers.add(
    watchDirectory(
      dirname,
      async (path) => {
        try {
          const stats = await stat(path);
          await watchFileOrDirectory(path, stats);
        } catch (err) {
          logger.warn(toError(err));
        }

        callback(path);
      },
      false
    )
  );

  for (const entry of await readdir(dirname, { withFileTypes: true })) {
    await watchFileOrDirectory(join(dirname, entry.name), entry);
  }

  return () => {
    for (const watcher of watchers) {
      watcher.close();
    }
  };

  async function watchFileOrDirectory(path: string, stats: Stats | Dirent) {
    if (match && !match(path, stats)) return;

    if (stats.isFile()) {
      watchers.add(watchFile(path, () => callback(path)));
    } else if (stats.isDirectory()) {
      await watchRecursive({
        dirname: path,
        callback,
        match,
        logger,
        watchers,
      });
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
