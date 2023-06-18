---
title: Error Handling
---

# Error Handling

GraphQLade servers allow passing a `resolverErrorHandler` function
which will handle any error thrown in resolvers.

This is useful for reporting errors (to the console or another logger)
and security (for masking errors that clients should not see).

Note that you cannot cancel errors in resolvers using this function.

## Example

```ts
import { GraphQLServer } from "graphqlade";
import { GraphQLContext } from "./GraphQLContext";
import { resolvers } from "./resolvers";

const gqlServer = await GraphQLServer.bootstrap<GraphQLContext>({
  resolvers,
  createContext({ headers }) {
    return { headers };
  },
  resolverErrorHandler(err, source, args, context, info) {
    // report error
    console.error(err.stack, context.headers["x-request-id"]);

    if (!isClientSafeError(err)) {
      // return safe error for clients
      return new Error("Internal server error");
    }
  },
});
```
