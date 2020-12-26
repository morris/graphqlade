# GraphQLade

GraphQLade is an opinionated, type-safe and complete toolset for
GraphQL + TypeScript development on both server- and client-side
that emphasizes a _GraphQL first_ approach.

## Why?

Existing solutions are obtrusive in some ways (e.g. high lock-in, missing
features) and over-engineered in others, and all of them suffer from
significant fragmentation.

Additionally, type-safety is often a secondary concern rather than a
design principle.

## Features

- Maximum type-safety during server- and client-side development
- Maximum validation at build time
- Integrates closely with [GraphQL.js](https://github.com/graphql/graphql-js).
  - Introduces very few additional concepts.
  - Stays close to the "language" used by GraphQL.js.
- Reads combined GraphQL documents recursively from directories.
  - Raises syntax errors with useful locations in source files.
- Almost dependency-free:
  - `graphql-js` (peer dependency)
  - `typescript` (optional, required for watch mode, but you'll have
    `typescript` anyway)
  - `prettier` (optional, but you'll get ugly code)
  - `ws` (optional, required for server-side web socket support)
  - `got` or some other HTTP request library (optional, required for remote
    introspection during client-side code generation)
- Class-based implementation with granular methods
  - Customization is easily possible through inheritance and method overrides.
  - Classes as config, so to say

### Server-Side

- Server-side code generation from GraphQL schemata
  - Generates types for
    - objects,
    - interfaces,
    - unions,
    - enums,
    - resolvers,
    - arguments,
    - directives,
    - ...
  - Source type substitution
  - Type mapping for scalars
  - Generated types are compatible with
    - [GraphQL Tools](https://www.graphql-tools.com/)
    - [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
  - Watch mode
- Runtime helpers for building executable
  [GraphQL.js](https://github.com/graphql/graphql-js) schemata
- Runtime helpers for serving GraphQL over HTTP
- Server-side GraphQL WebSocket
  - Supports [graphql-ws](https://github.com/enisdenjo/graphql-ws)
    (possibly the future standard)
  - Supports [subscription-transport-ws](https://github.com/apollographql/subscriptions-transport-ws)
    (e.g. [Apollo Client](https://www.apollographql.com/docs/react/))

**[Learn more about GraphQLade's server-side workflow →](./docs/server-side.md)**

### Client-Side

- Client-side code generation from GraphQL operations and remote schemata
  - Generates types for execution results of named operations
  - Generates an abstract class with methods for all named operations
    - Users only need to provide some `fetch` implementation.
  - Validates operations against a GraphQL API at build time
  - Extensions type injection
  - Type mapping for scalars
  - Watch mode
- Client-side GraphQL WebSocket _TBD_
  - Supports [graphql-ws](https://github.com/enisdenjo/graphql-ws)
    (possibly the future standard)
  - Supports [subscription-transport-ws](https://github.com/apollographql/subscriptions-transport-ws)
    (e.g. [Apollo Server](https://www.apollographql.com/docs/apollo-server/))

**[Learn more about GraphQLade's client-side workflow →](./docs/client-side.md)**
