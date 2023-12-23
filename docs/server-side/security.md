---
title: Security
---

# Security

GraphQLade comes with built-in security controls related directly to GraphQL.
For additional security controls on transport level
(e.g. HTTP rate limiting and body parsing),
consult best practices for the web framework in use.

## Max tokens

`parserOptions.maxTokens?: number`

Restricts the number of parse tokens in GraphQL operations to the specified number.

## Max depth

`parserOptions.maxDepth?: number`

Restricts the number of levels in GraphQL operations.
This control is especially important for schemas where circular operations can be constructed.

## Error masking

Use `resolverErrorHandler` (see below) to mask errors unsafe for clients.

## Example (Express)

```ts
import rateLimit from 'express-rate-limit';
import { GraphQLServer } from 'graphqlade';
import { GraphQLContext } from './GraphQLContext';
import { resolvers } from './resolvers';

const gqlServer = await GraphQLServer.bootstrap<GraphQLContext>({
  // ... other options ...
  parserOptions: {
    maxTokens: 1000,
    maxDepth: 10,
  },
  resolverErrorHandler(err, source, args, context, info) {
    // ... report error ...

    // return client-safe error
    return new Error('Internal server error');
  },
});

const app = express();

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.get('/graphql', rateLimiter, gqlServer.http.expressHandler());
app.post(
  '/graphql',
  rateLimiter,
  express.json({
    limit: '10kb',
  }),
  gqlServer.http.expressHandler(),
);

app.listen(3000);
```
