import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as path from "path";
import { createServer, Server } from "http";
import * as ws from "ws";
import { resolvers } from "./resolvers";
import { MyContext } from "./context";
import {
  buildExecutableSchema,
  GraphQLServer,
  GraphQLServerWebSocket,
  GraphQLWebSocketServer,
} from "../../../src"; // graphqlade/server in your app
import { AddressInfo } from "net";
import { Subscription } from "./resolvers/Subscription";
import { EventEmitter } from "events";

export async function bootstrap(env: NodeJS.ProcessEnv) {
  // build executable schema
  const schema = await buildExecutableSchema<MyContext>({
    root: __dirname + "/..",
    resolvers,
    subscriptionResolver: Subscription,
  });

  // build graphql server
  const gqlServer = new GraphQLServer<MyContext>({ schema });

  // basic pubsub
  const pubsub = new EventEmitter();

  // backend framework-dependent logic
  async function serveGraphQL(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (gqlServer.isNonGraphQLRequest(req)) {
      return res.sendFile(path.resolve(`${__dirname}/../public/graphiql.html`));
    }

    try {
      const response = await gqlServer.execute(req, new MyContext({ pubsub }));

      res.status(response.status).set(response.headers).json(response.body);
    } catch (err) {
      next(err);
    }
  }

  const app = express();

  app.use(cors());
  app.use("/", express.static(`${__dirname}/../../client/public`));
  app.get("/graphql", serveGraphQL);
  app.post("/graphql", bodyParser.json(), serveGraphQL);

  const server = createServer(app);

  const gqlWsServer = new GraphQLWebSocketServer({ schema });

  const wsServer = new ws.Server({
    server,
    path: "/graphql",
  });

  wsServer.on("connection", (socket, req) => {
    new GraphQLServerWebSocket({
      socket,
      req,
      subscribe: (args) =>
        gqlWsServer.subscribe(args, new MyContext({ pubsub })),
      connectionInitWaitTimeout: 1000,
    });
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
