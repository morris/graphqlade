import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import express from "express";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import * as ws from "ws";
import { buildExecutableSchema, GraphQLServer } from "../../../src"; // graphqlade in your app
import { MyContext } from "./context";
import { resolvers } from "./resolvers";

dotenv.config({ path: __dirname + "/../.env" });
dotenv.config({ path: __dirname + "/../default.env" });

export async function bootstrap(env: NodeJS.ProcessEnv) {
  // basic pubsub
  const pubsub = new EventEmitter();

  // build executable schema
  const schema = await buildExecutableSchema<MyContext>({
    root: __dirname + "/..",
    resolvers,
    resolverErrorHandler: (err) => {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    },
  });

  // build graphql server
  const gqlServer = new GraphQLServer<MyContext>({
    schema,
    createContext() {
      return new MyContext({ pubsub });
    },
    // web socket specific
    connectionInitWaitTimeout: 1000,
    acknowledge(socket, payload) {
      const keys = new Set(Array.isArray(payload?.keys) ? payload?.keys : []);

      if (!keys.has("MASTER_KEY")) {
        throw new Error("It appears to be locked");
      }

      return { version: 1 };
    },
  });

  // setup web server (express in this case)
  async function serveGraphQL(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const response = await gqlServer.http.execute(req);

      res.status(response.status).set(response.headers).json(response.body);
    } catch (err) {
      next(err);
    }
  }

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

  wsServer.on("connection", gqlServer.ws.connectionHandler());

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
