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

Take these with a grain of salt, as the methodology is probably flawed.
Updated July 1st 2024.

### graphqlade@1.9.0 + Node.js http

```
Running 20s test @ http://localhost:3000/graphql?query={hello}
10 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 0 ms │ 0 ms │ 1 ms  │ 1 ms │ 0.07 ms │ 0.47 ms │ 55 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬──────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev    │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┤
│ Req/Sec   │ 12,951  │ 12,951  │ 17,199  │ 17,583  │ 16,882  │ 1,025.81 │ 12,948  │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼──────────┼─────────┤
│ Bytes/Sec │ 1.94 MB │ 1.94 MB │ 2.58 MB │ 2.64 MB │ 2.53 MB │ 154 kB   │ 1.94 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴──────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 20

338k requests in 20.02s, 50.6 MB read
```

### graphqlade@1.9.0 + express@4.19.2

```
Running 20s test @ http://localhost:3000/graphql?query={hello}
10 connections

┌─────────┬──────┬──────┬───────┬──────┬────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg    │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼────────┼─────────┼───────┤
│ Latency │ 1 ms │ 1 ms │ 3 ms  │ 4 ms │ 1.3 ms │ 0.93 ms │ 59 ms │
└─────────┴──────┴──────┴───────┴──────┴────────┴─────────┴───────┘
┌───────────┬────────┬────────┬─────────┬─────────┬──────────┬────────┬────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%     │ 97.5%   │ Avg      │ Stdev  │ Min    │
├───────────┼────────┼────────┼─────────┼─────────┼──────────┼────────┼────────┤
│ Req/Sec   │ 3,705  │ 3,705  │ 6,207   │ 6,299   │ 5,845.55 │ 725.17 │ 3,704  │
├───────────┼────────┼────────┼─────────┼─────────┼──────────┼────────┼────────┤
│ Bytes/Sec │ 971 kB │ 971 kB │ 1.63 MB │ 1.65 MB │ 1.53 MB  │ 190 kB │ 970 kB │
└───────────┴────────┴────────┴─────────┴─────────┴──────────┴────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 20

117k requests in 20.02s, 30.6 MB read
```

### graphql-yoga@5.6.0

```
Running 20s test @ http://localhost:3000/graphql?query={hello}
10 connections

┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max    │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼────────┤
│ Latency │ 0 ms │ 0 ms │ 3 ms  │ 5 ms │ 0.69 ms │ 2.78 ms │ 160 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴────────┘
┌───────────┬────────┬────────┬─────────┬─────────┬─────────┬──────────┬────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%     │ 97.5%   │ Avg     │ Stdev    │ Min    │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼──────────┼────────┤
│ Req/Sec   │ 3,103  │ 3,103  │ 7,647   │ 10,495  │ 7,619.8 │ 2,060.51 │ 3,103  │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼──────────┼────────┤
│ Bytes/Sec │ 611 kB │ 611 kB │ 1.51 MB │ 2.07 MB │ 1.5 MB  │ 406 kB   │ 611 kB │
└───────────┴────────┴────────┴─────────┴─────────┴─────────┴──────────┴────────┘

Req/Bytes counts sampled once per second.
# of samples: 20

152k requests in 20.04s, 30 MB read
```
