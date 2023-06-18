---
title: Getting Started (Server-Side)
---

## 1. Install Dependencies

- `npm install graphql graphqlade`
- `npm install prettier typescript --save-dev`

## 2. Design a GraphQL schema using GraphQL SDL

- Put all GraphQL schema documents in one directory (`schema` is recommended).
- Non-standard import statements (as comments) are not required.

For example:

```graphql
# schema/Query.gql

type Query {
  praise: String!
}
```

## 3. Create a code generation script

Create a `gql2ts.mjs` script:

```js
import { gql2ts } from "graphqlade";

gql2ts({ server: true });
```

There are more advanced options which are discussed throughout the Wiki.
Type completion/IntelliSense should be available.

Add an entry under `scripts` of your `package.json`:

```json
{
  "scripts": {
    "gql2ts": "node gql2ts.mjs"
  },
}
```

### 4. Run code generation (in watch mode)

- `npm run gql2ts`
- OR `npm run gql2ts -- --watch`

## 5. Define context

Technically optional, but you will almost always need a GraphQL context class (instantiated per request):

```ts
// src/MyContext.ts

class MyContext {
  constructor(public headers: IncomingHttpHeaders) {}
}
```

## 6. Implement resolvers

You can now write resolvers for any GraphQL types using the generated
`Resolvers<TContext>` interface for type-safety and type-inference.

For example:

```ts
// src/resolvers.ts

import { Resolvers } from "./generated/schema";
import { MyContext } from "./MyContext";

export const resolvers: Resolvers<MyContext> = {
  Query: {
    praise() {
      return "the sun!";
    },
  },
};
```

## 7. Set up server

```ts
// src/start.ts

import { GraphQLServer } from "graphqlade";
import { MyContext } from "./MyContext";
import { resolvers } from "./resolvers";

const gqlServer = await GraphQLServer.bootstrap<MyContext>({
  root: `${__dirname}/..`,
  resolvers,
  createContext({ headers }) {
    return new MyContext(headers);
  },
});

// setup web server (express in this case)
const app = express();

app.get("/graphql", gqlServer.http.expressHandler());
app.post("/graphql", express.json(), gqlServer.http.expressHandler());

app.listen(3000);
```

Koa is also supported via `gqlServer.http.koaHandler()`.
Other frameworks may call `gqlServer.http.execute(req)` and use the result to form an HTTP response.

## 8. Start server

For example:

```sh
npx ts-node src/start.ts
```

For actual deployments you'll want to follow TypeScript/Node.js best practices, depending on your web server framework.

## 9. Iterate on schema and resolvers

- Changes to your schema will be reflected in generated types.
- Adjust implementation to fulfill resolver interfaces.

## Next Steps

See

- [Type Mapping](https://morris.github.io/graphqlade/server-side/type-mapping)
