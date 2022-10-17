## 1.0.0

- Upgrade dependencies, including moving to modern TS linting with eslint,
  using minimap directly, and removing now-unneeded dependencies.
- Moved to @one-ini/wasm as the parser
- Moved to GitHub Actions for CI
- Added automated API testing, with coverage statistics
- Ensured that all tests pass on Windows
- Added an option to receive information about which config files were used to
  produce the combined parameters
- Added an option for caching (including negative caching)
- **Breaking**: Now requires Node v14+

## 0.15.3
- Move @types dependencies to dev dependencies.
- Upgrade dependencies.

## 0.15.2
- Fix publish.

## 0.15.1
- Update dependencies.

## 0.15.0
- Convert source code into TypeScript. Generated type definitions are now provided.
- Remove dependency on Bluebird.
- **Breaking**: Node v4 no longer supported.
