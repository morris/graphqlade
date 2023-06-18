---
title: GraphQLade
---

# GraphQLade

GraphQLade is a lightweight but **complete** TypeScript library for
**GraphQL** development on server- and client-side.
It emphasizes a **GraphQL first** approach with **maximum type-safety** through
type generation from GraphQL schemas and GraphQL client operations.

With a rich feature set and zero dependencies besides
[GraphQL.js](https://github.com/graphql/graphql-js), it provides a highly
integrated foundation for GraphQL servers and clients at around
5000 lines of readable, tested code&mdash;all in **one place**.

## Getting Started

- **[Server-Side →](https://morris.github.io/graphqlade/server-side/getting-started)**
- **[Client-Side →](https://morris.github.io/graphqlade/client-side/getting-started)**
- **[API Reference →](https://morris.github.io/graphqlade/reference)**

## Design Principles

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
