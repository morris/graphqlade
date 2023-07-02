---
title: Stitching
---

# Stitching

[GraphQL stitching](https://the-guild.dev/graphql/stitching) is an effective
technology for building combined graphs from multiple GraphQL servers.

GraphQLade does not implement stitching algorithms for combining schemas;
see [The Guild's documentation](https://the-guild.dev/graphql/stitching/docs/getting-started/basic-example)
on how to combine multiple schemas using `@graphql-tools/stitch`.

However, GraphQLade supports exposing stitched schemas, as well as
building downstream GraphQL servers in stitching scenarios.

## Downstream

When setting `stitching: true` in both code generation and during server bootstrap,
the server's schema will provide stitching-related fields and directives (e.g. `_sdl`).
Additionally, GraphQLade provides `Query._sdlVersion` which is useful for
polling the schemas of downstream servers efficiently.

_TODO_

## Gateway

_TODO_
