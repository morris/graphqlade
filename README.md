# GraphQLade

GraphQLade is an opinionated, **complete** library for
**GraphQL + TypeScript** development on both server- and client-side.
It emphasizes a **GraphQL first** approach with **maximum type-safety** through
interface/type generation from GraphQL schemata and GraphQL client operations.

With a rich feature set and zero dependencies besides
[GraphQL.js](https://github.com/graphql/graphql-js), it provides a highly
integrated foundation for GraphQL servers and clients at currently under
4000 lines of readable, tested code&mdash;all in **one place**.

## Why?

Existing stacks (e.g. Apollo, GraphQL Tools, TypeGraphQL) are obtrusive in
some ways (high lock-in, missing features) and over-engineered in others,
and type-safety is often a secondary concern rather than a design principle.

Additionally, most stacks suffer from significant fragmentation. A lot of issues
are spread across many dependencies and maintainers, making improvements
difficult, and making it hard to reason about fitness of a particular
combination of dependencies.

## Status

- 90% test coverage
- Most features are fully tested through a complete example server and client.
- Minor API changes may occur in the future.
- Internals may change a bit in the future.
- Missing a lot of documentation.
- No production usage so far
- All the bugs in one place!
- Looking for feedback, contributions and testers.

## Design Principles

- GraphQL first
  1. Write schemata and/or (named) operations.
  2. Generate types & interfaces from GraphQL sources.
  3. Use runtime library to build type-safe servers/resolvers/clients/etc.
- GraphQL standard features only
- Builds upon and integrates tightly with [GraphQL.js](https://github.com/graphql/graphql-js).
  - Introduces very few additional concepts.
  - Stays close to the "language" used by GraphQL.js.

## Features

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
- Operation parser with LRU-cache
- Server-side GraphQL web sockets, including convenient server helpers
  - Supports [graphql-ws](https://github.com/enisdenjo/graphql-ws)
    (possibly the future standard)
  - Supports [subscription-transport-ws](https://github.com/apollographql/subscriptions-transport-ws)
    (e.g. [Apollo Client](https://www.apollographql.com/docs/react/))

**[Learn more about GraphQLade's server-side workflow →](./docs/server-side.md)**

### Client-Side

- Client-side code generation from GraphQL operations and remote schemata.
  - Generates types for execution results of named operations.
  - Generates an abstract class with methods for all named operations.
    - Users only need to provide some `fetch`-like implementation.
  - Validates operations against a GraphQL API at build time.
  - Type mapping for scalars
  - Watch mode
- Client-side GraphQL web sockets
  - Supports [graphql-ws](https://github.com/enisdenjo/graphql-ws)
    (possibly the future standard).
  - Supports [subscription-transport-ws](https://github.com/apollographql/subscriptions-transport-ws)
    (e.g. [Apollo Server](https://www.apollographql.com/docs/apollo-server/)).
  - Contains a reconnecting GraphQL web socket client.
  - Subscriptions implement `AsyncIterableIterator` correctly.

**[Learn more about GraphQLade's client-side workflow →](./docs/client-side.md)**

### General

- Reads combined GraphQL documents recursively from directories.
  - Raises syntax errors with useful locations in source files.
- Almost dependency-free:
  - `graphql` (peer dependency)
  - `typescript` (optional, required for watch mode, but you'll have
    `typescript` anyway)
  - `prettier` (optional, but you'll get ugly code)
  - `ws` (optional, required for server-side web socket support)
  - `got` or some other HTTP request library (optional, required only for remote
    introspection during client-side code generation)
- Class-based implementation with granular methods
  - Customization is easily possible through inheritance and method overrides.
  - Classes as config, so to say

## Missing Features

- Automatic persisted queries are more or less planned. There's no
  clear/emerging standard but it seems viable to add APQs in an opt-in
  fashion and make the protocol compatible with the Apollo stack.
- Caching was ignored so far. Apollo's `@cacheControl` style is viable but the
  benefit seems questionable. Will revisit soon.
- Remote schemata, stitching, merging, federation etc. look like they should be
  solved at build time and/or resolver level (plus directives) for now.
  Will revisit if there's high demand.
- Writing operations inline (with e.g. template strings tagged `gql`) are not
  planned. The current approach of separate and named operations in pure
  GraphQL, combined with interface/client generation, requires the least tooling
  and has great developer ergonomics (type safety, auto-completion, no
  duplication).
- File uploads are out of scope. It's recommended to use regular HTTP endpoints.
- IDE plug-ins are out of scope or not even required since GraphQLade doesn't
  introduce non-standard concepts. Existing plug-ins work well so far.
