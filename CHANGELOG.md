# Changelog

## NEXT

- BREAKING: Upgrade to `graphql@16`
- BREAKING: Upgrade to `ws@8`

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
