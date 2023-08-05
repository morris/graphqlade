<img src="https://raw.githubusercontent.com/morris/graphqlade/main/img/logo.png" alt="GraphQLade" width="336">

[![NPM version](https://img.shields.io/npm/v/graphqlade?style=flat-square)](https://www.npmjs.com/package/graphqlade)
[![Coverage](https://img.shields.io/codecov/c/github/morris/graphqlade?style=flat-square&token=5GBOZPEJW0)](https://app.codecov.io/gh/morris/graphqlade)

GraphQLade is a lightweight but **complete** TypeScript library for
**GraphQL** development on server- and client-side.
It emphasizes a **GraphQL first** approach with **maximum type-safety** through
type generation from GraphQL schemas and GraphQL client operations.

With a rich feature set and zero dependencies besides
[GraphQL.js](https://github.com/graphql/graphql-js), it provides a highly
integrated foundation for GraphQL servers and clients at around
5000 lines of readable, tested code&mdash;all in **one place**.

## Documentation

- **[Getting started →](https://morris.github.io/graphqlade)**
- **[API reference →](https://morris.github.io/graphqlade/reference)**

## Design principles

### GraphQL first

GraphQL schemas and operations are defined through spec-compliant,
**plain GraphQL files**.

### Type-safety through code generation

GraphQLade generates a complete set of **TypeScript types and interfaces** from
GraphQL sources, both for schemas and operations, including type tables mapping
operation names to their variable and result interfaces.

### Enhance and integrate with GraphQL.js

GraphQLade provides a rich, **type-safe runtime library** for building HTTP
and WebSocket servers, resolvers and clients. It transparently integrates with
[GraphQL.js](https://github.com/graphql/graphql-js), introducing very few
additional concepts and staying close to the "language" used by GraphQL.js.

## Why?

Existing stacks (e.g. Apollo, GraphQL Tools, TypeGraphQL) are obtrusive in
some ways (high lock-in, missing features) and over-engineered in others,
while **type-safety** is often a secondary concern rather than a design principle.

Additionally, most stacks suffer from
[significant fragmentation](https://httptoolkit.tech/blog/simple-graphql-server-without-apollo/).
Issues are spread across many packages and maintainers, making it hard to reason
about fitness of a particular combination of dependencies and stalling
improvements to the ecosystem.

## Contributors

- [emargollo](https://github.com/emargollo) - Stitching support
- [sreedhap](https://github.com/sreedhap) - Fix calling `next` in Koa/Express
- [jayne-mast](https://github.com/jayne-mast) - Allow `prettier` >= 2

Thanks!
