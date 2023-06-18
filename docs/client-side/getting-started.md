---
title: Getting Started (Client-Side)
---

# Getting Started (Client-Side)

## 1. Install Dependencies

- `npm install graphql graphqlade prettier typescript --save-dev`

## 2. Design GraphQL operations

- Write one file per _named_ GraphQL operation.
  - Unnamed operations are not supported (nor recommended).
- Put GraphQL operation files in one directory (`operations` is recommended).
- Non-standard import statements (as comments) are not required.

For example:

```graphql
# operations/Praise.gql

query Praise {
  praise
}
```

## 3. Create a code generation script

Create a `gql2ts.mjs` script:

```js
import { gql2ts } from "graphqlade";

gql2ts({
  introspection: {
    url: "http://localhost:3000/graphql",
  },
  client: true,
});
```

There are more advanced options discussed throughout the documentation.
Type completion/IntelliSense should be available.

Add an entry under `scripts` of your `package.json`:

```json
{
  "scripts": {
    "gql2ts": "node gql2ts.mjs"
  }
}
```

## 4. Run code generation (in watch mode)

- `npm run gql2ts`
- OR `npm run gql2ts -- --watch`

## 5. Create a GraphQL client

Create a type-safe `GraphQLClient` instance by using the generated typings and operations:

```ts
import { GraphQLClient } from "graphqlade/dist/browser";
import { typings } from "./generated/operations";

const client = new GraphQLClient({
  url: "http://localhost:3000/graphql",
  typings,
});

client.postNamed("Praise").then((data) => console.log(data));
```

## 6. Iterate on user interface

You can now use the client to issue operations against your GraphQL server
in a type-safe way. Changes to your operations will be reflected in the client.
