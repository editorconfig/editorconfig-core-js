# EditorConfig JavaScript Core

[![Tests](https://github.com/editorconfig/editorconfig-core-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/editorconfig/editorconfig-core-js/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/editorconfig/editorconfig-core-js/badge.svg?branch=master)](https://coveralls.io/github/editorconfig/editorconfig-core-js?branch=master)

The EditorConfig JavaScript core will provide the same functionality as the
[EditorConfig C Core][] and [EditorConfig Python Core][].

## Installation

You need [node][] to use this package.

To install the package locally:

```bash
$ npm install editorconfig
```

To install the package system-wide:

```bash
$ npm install -g editorconfig
```

## Usage

### in Node.js:

#### parse(filePath[, options])

options is an object with the following defaults:

```js
{
  config: '.editorconfig',
  version: pkg.version,
  root: '/',
  files: false
};
```

Search for `.editorconfig` starting from the current directory to the root directory.

Example:

```js
const editorconfig = require('editorconfig');
const path = require('path');

const filePath = path.join(__dirname, 'sample.js');

(async () => {
  console.log(await editorconfig.parse(filePath, {files: true}));
})();
/*
  {
    indent_style: 'space',
    indent_size: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
    tab_width: 2,
    [Symbol(FILES)]: [
      ['[DIRECTORY]/.editorconfig', '*']
      ['[DIRECTORY]/.editorconfig', '*.js']
    ]
  };
*/
```

When the `files` option is true, the Symbol `editorconfig.FILES` accesses an
array of string pairs that specify which .editorconfig files and section names
contributed to the returned configuration.

#### parseSync(filePath[, options])

Synchronous version of `editorconfig.parse()`.

#### parseString(fileContent)

The `parse()` function above uses `parseString()` under the hood. If you have your file contents
just pass it to `parseString()` and it'll return the same results as `parse()`.

#### parseFromFiles(filePath, configs[, options])

options is an object with the following defaults:

```js
{
  config: '.editorconfig',
  version: pkg.version,
  root: '/',
  files: false
};
```

Specify the `.editorconfig`.

Example:

```js
const editorconfig = require('editorconfig');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '.editorconfig');
const configs = [
  {
    name: configPath,
    contents: fs.readFileSync(configPath, 'utf8')
  }
];

const filePath = path.join(__dirname, '/sample.js');

(async () => {
  console.log(await editorconfig.parseFromFiles(filePath, configs))
})();
/*
  {
    indent_style: 'space',
    indent_size: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
    tab_width: 2,
    [Symbol(FILES)]: ['[DIRECTORY]/.editorconfig']
  };
*/
```

#### parseFromFilesSync(filePath, configs[, options])

Synchronous version of `editorconfig.parseFromFiles()`.

### in Command Line

```bash
$ ./bin/editorconfig

Usage: editorconfig [options] <FILEPATH...>

Arguments:
  FILEPATH       Files to find configuration for.  Can be a hyphen (-) if you
                 want path(s) to be read from stdin.

Options:
  -v, --version  Display version information from the package
  -f <path>      Specify conf filename other than '.editorconfig'
  -b <version>   Specify version (used by devs to test compatibility)
  --files        Output file names that contributed to the configuration,
                 rather than the configuation itself
  -h, --help     display help for command
```

Example:

```bash
$ ./bin/editorconfig /home/zoidberg/humans/anatomy.md
charset=utf-8
insert_final_newline=true
end_of_line=lf
tab_width=8
trim_trailing_whitespace=sometimes
```

```bash
$ ./bin/editorconfig --files /home/zoidberg/humans/anatomy.md
/home/zoidberg/.editorconfig
/home/zoidberg/humans/.editorconfig
```

## Development

To install dependencies for this package run this in the package directory:

```bash
$ npm install
```

Next, run the following commands:

```bash
$ npm run build
$ npm link
```

The global editorconfig will now point to the files in your development
repository instead of a globally-installed version from npm. You can now use
editorconfig directly to test your changes.

If you ever update from the central repository and there are errors, it might
be because you are missing some dependencies. If that happens, just run npm
link again to get the latest dependencies.

To test the command line interface:

```bash
$ editorconfig <filepath>
```

# Testing

[CMake][] must be installed to run the tests.

To run the tests:

```bash
$ npm test
```

To run the tests with increased verbosity (for debugging test failures):

```bash
$ npm run ci
```

[EditorConfig C Core]: https://github.com/editorconfig/editorconfig-core
[EditorConfig Python Core]: https://github.com/editorconfig/editorconfig-core-py
[node]: http://nodejs.org/
[cmake]: http://www.cmake.org
