import EventEmitter from 'events';
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

export function requireExampleServer(env?: NodeJS.ProcessEnv) {
  const ready = main({ PORT: '0', ...env });

  beforeAll(() => ready);

  afterAll(async () => {
    const { server } = await ready;

    return new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
  });

  return ready.then((r) => ({
    ...r,
    url: `http://localhost:${r.port}/graphql`,
    wsUrl: `ws://localhost:${r.port}/graphql`,
  }));
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
