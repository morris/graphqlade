# Changelog

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
