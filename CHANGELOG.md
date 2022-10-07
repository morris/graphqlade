# Changelog

## NEXT

- Add `getProjection` utility function to support efficient database lookups
- Simplify builds
- Uplift `__typename` from fragments to simplify generated type system
- Fix issue where no `__typename` in top-level operations lead to type system difficulties
- Update deps

## v1.3.2

- Ignore internal types in `GraphQLSchemaManager.setDefaultFieldResolver` and `.setResolverErrorHandler`

## v1.3.1

- Improve performance of resolver error handlers

## v1.3.0

- Add GraphQL stitching support
  - Code generation for directives and resolvers
  - SDL resolvers
- Update deps

## v1.2.0

- Include JSON body (if any) in `GraphQLRequestError`
- Add `errorFilter` to `GraphQLClient` options
- Improve error messages in `GraphQLClient`
- Update deps

## v1.1.1

- Fix `GraphQLCLient.setHeaders` to safely reset headers
- Export `GraphQLResultError` in browser build
- Fix `GraphQLWebSocketClient.subscribe` typings

## v1.1.0

- Update deps
- Fall back to `unknown` for unmapped scalars
- Add `OperationTypings` in client-side code generation for simplified client typing
- Add `fetch`-based, type-safe `GraphQLClient` for queries and mutations
- Add type-safe `subscribeNamed` method to `GraphQLWebSocketClient`
- Add API documentation
- Support `fetch` in introspection and code generation
- Add `getHeaders` option to introspection in code generation (e.g. to support auth)

## v1.0.0

- BREAKING CHANGES
  - Upgrade to `graphql@16`
  - Upgrade to `ws@8`
  - Remove `AbstractClient` code generation in favor of operation tables
  - Rename `GraphQLServer` to `GraphQLHttpServer`
  - `GraphQLHttpServer` now requires a context type and a `createContext` function
  - Move `src/execute` modules to `src/server`
  - Remove specific subscription resolver options (add subscription resolvers to regular resolver map)
  - Code generation now automatically creates `_ts.gql` with the `@ts` directive definition
  - Refactor `buildExecutableSchema` into static `GraphQLServer.bootstrap` method (bootstraps complete server)
  - Refactor `GraphQLSchemaManager` methods
- Add `GraphQLServer` class, combining HTTP and web socket server setup
- Add `DirectivesMap` (maps directive names to their arguments) to code generation
- Add simplified request handlers for Express and Koa
- Allow lists of resolvers in `GraphQLServer.bootstrap`, merged via new utility `mergeResolvers` function

## v0.3.5

- Update dependencies
- Fix audit
- Switch to Jest
- Add tests
- Add Node.js 16.x to pipeline

## v0.3.4

- Include `src` in NPM package for better source map support

## v0.3.3

- Move documentation to GitHub wikis
- Add tests
- Chores and clean-ups
- Update dependencies
- Normalize error handling (thanks TypeScript!)
- Export `AsyncPushIterator` in browser build
- Fix bug where subscriptions where not closed when returned client-side

## v0.3.2

- Make `typeRef<T>` always return an object for chaining

## v0.3.1

- Fix generation of operation names if some type of operation is unused

## v0.3.0

- Add generation of client operation tables
  - Operation name to document (const)
  - Operation name to variables type (interface)
  - Operation name to data type (interface)
  - Operation name to data type (interface)
  - Operation name types
- Rename `certain` helper to `typeRef` (breaking change)
- Ignore non-GraphQL files in watch mode

## v0.2.0

- Refactor web socket package
  - Allow creating a context per web socket subscription (breaking change)
  - Refactor auto-reconnect API in client web sockets (breaking change)
  - Improve auto-reconnection in client web sockets
- Refactor package structure
- Fix UMD build
- Improved types for resolver maps
- Add some doc-block comments
- Enable subscriptions in example GraphiQL

## v0.1.2

- Drop "opinionated" in README and description
- Fix watch mode

## v0.1.1

- Turn optional dependencies into peer dependencies

## v0.1.0

- Initial version
