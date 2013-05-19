# EditorConfig JavaScript Core

The EditorConfig JavaScript core will provide the same functionality as the
[EditorConfig C Core][] and [EditorConfig Python Core][].

## Installation

You need [node][] to use this package.

To install this package (system-wide):

    sudo npm install -g .

## Usage

Usage as a Node library:

    $ node
    > var editorconfig = require('./editorconfig');
    undefined
    > editorconfig.parse('/home/zoidberg/humans/anatomy.md');
    { charset: 'utf-8',
      insert_final_newline: 'true',
      end_of_line: 'lf',
      tab_width: '8',
      trim_trailing_whitespace: 'sometimes' }


Usage as a command line tool:

    $ editorconfig /home/zoidberg/humans/anatomy.md
    charset=utf-8
    insert_final_newline=true
    end_of_line=lf
    tab_width=8
    trim_trailing_whitespace=sometimes

## Development

To install dependencies for this package run this in the package directory:

    npm install

To test the command line interface:

    ./bin/editorconfig <filepath>

# Testing

[CMake][] must be installed to run the tests.

To run the tests:

    npm test

To run the tests with increased verbosity (for debugging test failures):

    ctest -VV --output-on-failure .

[EditorConfig C Core]: https://github.com/editorconfig/editorconfig-core
[EditorConfig Python Core]: https://github.com/editorconfig/editorconfig-core-py
[node]: http://nodejs.org/
[cmake]: http://www.cmake.org
