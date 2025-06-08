import EventEmitter from 'events';
import { Server } from 'http';
import { after, before } from 'node:test';
import WebSocket from 'ws';
import { MyContext } from '../examples/server/src/MyContext';
import { main } from '../examples/server/src/main';
import { resolvers } from '../examples/server/src/resolvers';
import { GraphQLServer, assert } from '../src';
import { LoggerLike } from '../src/util/LoggerLike';

export function bootstrapExample() {
  return GraphQLServer.bootstrap<MyContext>({
    root: `${__dirname}/../examples/server`,
    resolvers,
    createContext({ headers }) {
      assert(headers);

      return new MyContext({
        pubsub: new EventEmitter(),
      });
    },
  });
}

export async function requireExampleServer(env?: NodeJS.ProcessEnv) {
  const ready = main({ PORT: '0', ...env });

  before(() => ready);

  after(async () => {
    const { server } = await ready;

    return serverClosed(server);
  });

  const r = await ready;

  return {
    ...r,
    url: `http://localhost:${r.port}/graphql`,
    wsUrl: `ws://localhost:${r.port}/graphql`,
  };
}

export function serverClosed(server: Server) {
  return new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
}

export function wsClosed(socket: WebSocket): Promise<[number, string]> {
  return new Promise((resolve) => {
    socket.on('close', (code, reason) => {
      resolve([code, reason.toString()]);
    });
  });
}

export class TestLogger implements LoggerLike {
  public readonly logs: Array<string | Error> = [];
  public readonly warnings: Array<string | Error> = [];
  public readonly errors: Array<string | Error> = [];

  log(message: string | Error) {
    this.logs.push(message);
  }

  warn(message: string | Error) {
    this.warnings.push(message);
  }

  error(message: string | Error) {
    this.errors.push(message);
  }
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function mockFetchJson(json: unknown, rest?: Partial<Response>) {
  return mockFetch(mockJsonResponse(json, rest));
}

export function mockFetch(response: Partial<Response>) {
  return async () => {
    return { ok: true, status: 200, statusText: 'OK', ...response } as Response;
  };
}

export function mockJsonResponse(json: unknown, rest?: Partial<Response>) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    ...rest,
    async json() {
      return json;
    },
  } as Response;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatForAssertion(result: any): any {
  if (Array.isArray(result)) {
    return result.map(formatForAssertion);
  } else if (result instanceof Error) {
    return { message: result.message };
  } else if (result instanceof Date) {
    return result;
  } else if (typeof result === 'object' && result) {
    return Object.fromEntries(
      Object.entries(result).map(([key, value]) => [
        key,
        formatForAssertion(value),
      ]),
    );
  }

  return result;
}
