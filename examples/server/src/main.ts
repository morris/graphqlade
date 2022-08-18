import cors from "cors";
import { EventEmitter } from "events";
import express from "express";
import { createServer } from "http";
import * as ws from "ws";
import { GraphQLServer, listen } from "../../../src"; // graphqlade in your app
import { MyContext } from "./MyContext";
import { resolvers } from "./resolvers";

export async function main(env: NodeJS.ProcessEnv) {
  // basic pubsub
  const pubsub = new EventEmitter();

  // bootstrap graphql server
  const gqlServer = await GraphQLServer.bootstrap<MyContext>({
    root: `${__dirname}/..`,
    resolvers,
    stitching: true,
    resolverErrorHandler(err) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    },
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
  const app = express();

  app.use(cors());
  app.use("/", express.static(`${__dirname}/../../client/public`));
  app.use("/graphql", express.static(`${__dirname}/../public/graphql`));
  app.get("/graphql", gqlServer.http.expressHandler());
  app.post("/graphql", express.json(), gqlServer.http.expressHandler());

  const server = createServer(app);

  // setup web socket server
  const wsServer = new ws.Server({
    server,
    path: "/graphql",
  });

  wsServer.on("connection", gqlServer.ws.connectionHandler());

  const port = await listen(server, parseInt(env.PORT ?? "4000", 10));

  return {
    server,
    port,
  };
}
