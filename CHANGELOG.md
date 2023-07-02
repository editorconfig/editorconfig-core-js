## 2.0.0

- **Breaking**: Now requires Node v16+
- Enable extended globbing from minimatch.  This means that some patterns will
  work in this version might not work in other editorconfig implementations.
  Fixes #84.
- Add `unset` option to API and CLI.  When enabled, properties with the value
  "unset" will be removed from the returned object.  Defaults to false in all
  cases, since according to the core team, this is something that the editor
  plugin is supposed to do, and the tests reinforce this. An `unset()`
  function is now exported if you'd like to call it explicitly.
  Fixes #123.

## 1.0.3

- Updated all dependencies, including security fixes for semver 7.3.8

## 1.0.2

- Updated all dependencies, including breaking changes from minimatch and
  rimraf.
- Removed @types/minimatch in favor of minimatch's built-in type definitions.

## 1.0.1

- Fixed #111 by updating to latest version of one-ini.  Config files that
  contained empty comment lines would cause parse failures.

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
