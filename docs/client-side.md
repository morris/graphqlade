# GraphQLade Client-Side

## Workflow

### 1. Install Dependencies

- `npm install graphql graphqlade prettier typescript --save-dev`
- `npm install got --save-dev` (or any other Node.js request/fetch library)

### 2. Design GraphQL operations

- Write one file per _named_ GraphQL operation.
  - Unnamed operations are not supported (nor recommended).
- Put GraphQL operation files in one directory (`operations` is recommended).
- Non-standard import statements (as comments) are not required.

### 3. Create a code generation script

Create a `gql2ts.js` script.
See [examples/client/gql2ts.js](../examples/client/gql2ts.js).
Type completion/IntelliSense should be available.

Add an entry under `scripts` of your `package.json`:

```js
{
  "scripts": {
    "gql2ts": "node gql2ts.js"
  },
}
```

### 4. Run code generation (in watch mode)

- `npm run gql2ts`
- OR `npm run gql2ts -- --watch`

### 5. Implement GraphQL client

The code generation created an `AbstractClient` type with methods for all your
operations. You only need to inherit from that class and implement `query`,
`mutate`, and `subscribe` (depending on your schema, some may be optional).

See [examples/client/src/client.ts](../examples/client/src/client.ts).
Adjust to your frontend framework.

### 6. Iterate on user interface

You can now use the client to issue operations against your GraphQL server
in a type-safe way. Changes to your operations will be reflected in the client.

See [examples/client/src/app.ts](../examples/client/src/app.ts).
