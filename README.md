<img src="https://raw.githubusercontent.com/morris/graphqlade/main/img/logo.png" alt="GraphQLade" width="336">

[![NPM version](https://img.shields.io/npm/v/graphqlade?style=flat-square)](https://www.npmjs.com/package/graphqlade)
[![Build status](https://img.shields.io/github/workflow/status/morris/graphqlade/Pipeline?style=flat-square)](https://github.com/morris/graphqlade/actions)
[![Coverage](https://img.shields.io/codecov/c/github/morris/graphqlade?style=flat-square&token=5GBOZPEJW0)](https://app.codecov.io/gh/morris/graphqlade)

GraphQLade is a lightweight but **complete** library for
**GraphQL + TypeScript** development on both server- and client-side.
It emphasizes a **GraphQL first** approach with **maximum type-safety** through
interface/type generation from GraphQL schemata and GraphQL client operations.

With a rich feature set and zero dependencies besides
[GraphQL.js](https://github.com/graphql/graphql-js), it provides a highly
integrated foundation for GraphQL servers and clients at around
4000 lines of readable, tested code&mdash;all in **one place**.

## Why?

Existing stacks (e.g. Apollo, GraphQL Tools, TypeGraphQL) are obtrusive in
some ways (high lock-in, missing features) and over-engineered in others
while **type-safety** is often a secondary concern rather than a design principle.

Additionally, most stacks suffer from
[significant fragmentation](https://httptoolkit.tech/blog/simple-graphql-server-without-apollo/).
Issues are spread across many packages and maintainers, making it hard to reason
about fitness of a particular combination of dependencies and stalling
improvements to the ecosystem.

## Design principles

### GraphQL first

GraphQL schemata and operations are defined through spec-compliant,
**plain GraphQL files**.

### Type-safety through code generation

GraphQLade generates a complete set of **TypeScript types and interfaces** from
GraphQL sources, both for schemata and operations, including type tables mapping
operation names to their variable and result interfaces.

### Enhance and integrate with GraphQL.js

GraphQLade provides a library of **type-safe runtime helpers** for building HTTP
and WebSocket servers, resolvers and clients. They transparently integrate with
[GraphQL.js](https://github.com/graphql/graphql-js), introducing very few
additional concepts and staying close to the "language" used by GraphQL.js.

## Features

### Server-side

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

**[Learn more about GraphQLade's server-side workflow →](https://github.com/morris/graphqlade/wiki/Server-Side-Usage)**

### Client-side

- Client-side code generation from GraphQL operations and remote schemata.
  - Generates interfaces for variables and results of named operations.
  - Generates tables mapping operation names to their respective variable and
    result interfaces.
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

**[Learn more about GraphQLade's client-side workflow →](https://github.com/morris/graphqlade/wiki/Client-Side-Usage)**

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

## Missing features

- Federation compatible with the
  [Apollo Federation specification](https://www.apollographql.com/docs/federation/federation-spec/)
  is planned, including a gateway implementation.
- Automatic persisted queries are planned. There's no clear/emerging standard
  but it seems viable to add APQs in an opt-in fashion and make the protocol
  compatible with the Apollo stack.
- Caching was ignored so far. Apollo's `@cacheControl` style is viable but the
  benefit seems questionable.
- Writing operations inline (with e.g. template strings tagged `gql`) are not
  planned. The current approach of separate and named operations in pure
  GraphQL, combined with interface/client generation, requires the least tooling
  and has great developer ergonomics (type safety, auto-completion, no
  duplication).
- File uploads are out of scope. It's recommended to use regular HTTP endpoints.
- IDE plug-ins are out of scope or not even required since GraphQLade doesn't
  introduce non-standard concepts. Existing plug-ins work well so far.
