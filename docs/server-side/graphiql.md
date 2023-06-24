---
title: GraphiQL
---

# GraphiQL

GraphQLade ships with a minimal GraphiQL setup;
just a directory with an `index.html`.
The path to this directory can be retrieved with `GraphiQL.path()`.

For example:

```ts
import { GraphQLServer, GraphiQL } from "graphqlade";
import { GraphQLContext } from "./GraphQLContext";
import { resolvers } from "./resolvers";

const gqlServer = await GraphQLServer.bootstrap<GraphQLContext>({
  // ... options ...
});

// setup web server (express in this case)
const app = express();

app.use("/graphql", express.static(GraphiQL.path()));
app.get("/graphql", gqlServer.http.expressHandler());
app.post("/graphql", express.json(), gqlServer.http.expressHandler());

app.listen(3000);
```
