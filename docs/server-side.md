# GraphQLade Server-Side

## Workflow

### 1. Install Dependencies

- `npm install graphql graphqlade`
- `npm install prettier typescript --save-dev`

### 2. Design a GraphQL schema using the GraphQL SDL

- Put all GraphQL schema documents in one directory (`schema` is recommended).
- Non-standard import statements (as comments) are not required.

### 3. Create a code generation script

Create a `gql2ts.js` script.
See [examples/server/gql2ts.js](../examples/server/gql2ts.js).
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

### 5. Set up server

See [examples/server/src/server.ts](../examples/server/src/server.ts).
Adjust to your backend framework.

### 6. Implement resolvers

You can now write resolvers for any GraphQL types using the generated
`ResolverMap<TContext>` interface for type-safety and type-inference.

See [examples/server/src/resolvers](../examples/server/src/resolvers).

### 7. Iterate on schema and resolvers

- Changes to your schema will be reflected in generated types.
- Adjust implementation to fulfill resolver interfaces.

## TypeScript Type Mapping

Usually, your _source_ data (e.g. from a database or an external endpoint)
will not exactly match the types defined in your schema. In the example app,
a `Customer` references `Contracts` internally through IDs, whereas
the schema naturally allows retrieving the full `Contract` objects
from the `Customer`.

To handle this in a type-safe way, the `@ts` directive provides
a way to map GraphQL types to TypeScript types.
First, you'll need to add the `@ts` directive to your schema
(it's recommended to put all directives into `schema/directives.gql`):

```gql
directive @ts(
  type: String!
  inputType: String
  from: String
) on OBJECT | INTERFACE | ENUM | SCALAR
```

By creating a _source_ interface `CustomerSource` in TypeScript
which knows about the `contractIds`, and adding
a mapping via the `@ts` directive, you will _receive_ and _return_
`CustomerSource` objects instead of `Customer` objects in your resolvers:

```gql
# In all field resolvers of the "Customer" resolver,
# the "source" argument shall be of type "CustomerSource".
# Likewise, all field resolvers that should resolve to a GraphQL "Customer",
# the return type shall be of TypeScript type "CustomerSource".
# "CustomerSource" shall be imported from "../types"
# (relative to the location of the generated code).
type Customer @ts(type: "CustomerSource" from: "../types") {
  ...
}
```

The `QueryResolver` can now safely _return_ customer data as
`CustomerSource` objects.
In turn, the `CustomerResolver` is then able to resolve the `contracts` field
by using the internal customer data in a type-safe way,
because it _receives_ `CustomerSource` objects in the `data`-argument
of it's resolver functions.

Note how almost none of the types in `src/resolvers/*.ts`
have to be made explicit, which makes the code very readable and
greatly reduces the chance of programmer errors.

### Input Type Mapping

For some scalars, it is useful to be able to return multiple types
in resolvers. A `DateTime`-scalar may be returned as a JavaScript
`Date`-object or as a ISO-string because the serializer accepts both,
so it is useful to map the GraphQL `DateTime` to `string | Date`
internally using `@ts(type: "...")`.

When a scalar is used as an input, you'll likely know the specific
type being returned by the deserializer. For example, if you know
the deserializer for `DateTime` always returns a `Date`-object,
you should add `inputType: "Date"` to your `@ts` directive:

```gql
# Field resolvers resolving to GraphQL "DateTime" may return "string | number | Date".
# Input fields of GraphQL type "DateTime" shall be of TypeScript type "Date".
scalar DateTime @ts(type: "string | number | Date", inputType: "Date")
```
