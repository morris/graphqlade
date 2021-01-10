import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer, Server } from "http";
import * as ws from "ws";
import { resolvers } from "./resolvers";
import { MyContext } from "./context";
import {
  buildExecutableSchema,
  GraphQLServer,
  GraphQLWebSocketServer,
} from "../../../src"; // graphqlade/dist/server in your app
import { AddressInfo } from "net";
import { Subscription } from "./resolvers/Subscription";
import { EventEmitter } from "events";

dotenv.config({ path: __dirname + "/../.env" });
dotenv.config({ path: __dirname + "/../default.env" });

export async function bootstrap(env: NodeJS.ProcessEnv) {
  // basic pubsub
  const pubsub = new EventEmitter();

  // build executable schema
  const schema = await buildExecutableSchema<MyContext>({
    root: __dirname + "/..",
    resolvers,
    subscriptionResolver: Subscription,
    resolverErrorHandler: (err) => {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    },
  });

  // build graphql server
  const gqlServer = new GraphQLServer<MyContext>({ schema });

  // backend framework-dependent logic
  async function serveGraphQL(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const response = await gqlServer.execute(req, new MyContext({ pubsub }));

      res.status(response.status).set(response.headers).json(response.body);
    } catch (err) {
      next(err);
    }
  }

  // build graphql web socket server
  const gqlWsServer = new GraphQLWebSocketServer<MyContext>({
    schema,
    connectionInitWaitTimeout: 1000,
    acknowledge: (socket, payload) => {
      const keys = Array.isArray(payload?.keys)
        ? new Set(payload?.keys)
        : new Set();

      if (!keys.has("MASTER_KEY")) {
        throw new Error("It appears to be locked");
      }

      return { version: 1 };
    },
    createContext() {
      return new MyContext({ pubsub });
    },
  });

  // setup web server (express in this case)
  const app = express();

  app.use(cors());
  app.use("/", express.static(`${__dirname}/../../client/public`));
  app.use("/graphql", express.static(`${__dirname}/../public/graphql`));
  app.get("/graphql", serveGraphQL);
  app.post("/graphql", bodyParser.json(), serveGraphQL);

  const server = createServer(app);

  const wsServer = new ws.Server({
    server,
    path: "/graphql",
  });

  wsServer.on("connection", (socket, req) => {
    const gqlSocket = gqlWsServer.handleConnection(socket, req);

    // just for testing disconnections
    setTimeout(() => {
      gqlSocket.close(1000, "WS_MAX_TIME");
    }, parseInt(process.env.WS_MAX_TIME ?? "10000", 10));
  });

  server.listen(env.PORT ? parseInt(env.PORT, 10) : 4000);

  return new Promise<Server>((resolve, reject) => {
    server.on("listening", () => {
      const port = (server.address() as AddressInfo).port;
      // eslint-disable-next-line no-console
      console.log(`http://localhost:${port}/graphql`);

      resolve(server);
    });

    server.on("error", reject);
  });
}

if (require.main === module) {
  bootstrap(process.env).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
