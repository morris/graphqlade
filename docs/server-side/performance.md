---
title: Performance
---

# Performance

GraphQLade comes with a few built-in performance optimizations.
Other than that, performance should be optimized at
resolver level (e.g. [data loader pattern](https://github.com/graphql/dataloader))
or transport level (e.g. compression, streamed body parsing).

## Parser cache

GraphQLade caches parse and validation results in an LRU (least recently used) cache
with a cache size of 50 by default.
The cache size can be configured via `parserOptions.cacheSize`.

## Benchmarks

TODO
