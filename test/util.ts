import { Server } from "http";
import WebSocket from "ws";
import { bootstrap } from "../examples/server/src/server";

export function requireExampleServer(env?: NodeJS.ProcessEnv) {
  let server: Server;

  before(async () => {
    server = await bootstrap({ PORT: "4999", ...env });
  });

  after(async () => {
    if (!server) return;

    return new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  });
}

export function wsClosed(socket: WebSocket): Promise<[number, string]> {
  return new Promise((resolve) => {
    socket.on("close", (code, reason) => {
      resolve([code, reason]);
    });
  });
}

export class TestLogger {
  public readonly logs: string[] = [];
  public readonly errors: string[] = [];

  log(message: string) {
    // eslint-disable-next-line no-console
    console.log(message);
    this.logs.push(message);
  }

  error(message: string) {
    // eslint-disable-next-line no-console
    console.error(message);
    this.errors.push(message);
  }
}

export function cleanJson(json: unknown): unknown {
  if (Array.isArray(json)) {
    return json.map((it) => cleanJson(it));
  }

  if (json && typeof json === "object") {
    const input = json as Record<string, unknown>;

    return Object.keys(input).reduce<Record<string, unknown>>(
      (output, key) => Object.assign(output, { [key]: cleanJson(input[key]) }),
      {}
    );
  }

  return json;
}
