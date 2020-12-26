import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as path from "path";
import { Server } from "http";
import { resolvers } from "./resolvers";
import { MyContext } from "./context";
import { buildExecutableSchema, GraphQLServer } from "../../.."; // graphqlade/server in your app
import { AddressInfo } from "net";

export async function bootstrap(env: NodeJS.ProcessEnv) {
  // build executable schema
  const schema = await buildExecutableSchema<MyContext>({
    root: __dirname + "/..",
    resolvers,
  });

  // build graphql server
  const gqlServer = new GraphQLServer<MyContext>({ schema });

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
      const response = await gqlServer.execute(req, new MyContext());

      res.status(response.status).set(response.headers).json(response.body);
    } catch (err) {
      next(err);
    }
  }

  const app = express();

  app.use(cors());
  app.get("/graphql", serveGraphQL);
  app.post("/graphql", bodyParser.json(), serveGraphQL);

  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(env.PORT ? parseInt(env.PORT, 10) : 4000, () => {
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
