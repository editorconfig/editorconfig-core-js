// tslint:disable:no-console
import program from 'commander'

import * as editorconfig from './'

import pkg from '../package.json'

export default function cli(args: string[]) {
  program.version('EditorConfig Node.js Core Version ' + pkg.version)

  program
    .usage([
        '[OPTIONS] FILEPATH1 [FILEPATH2 FILEPATH3 ...]',
        program._version,
        'FILEPATH can be a hyphen (-) if you want path(s) to be read from stdin.',
      ].join('\n\n  '))
    .option('-f <path>',     'Specify conf filename other than \'.editorconfig\'')
    .option('-b <version>',  'Specify version (used by devs to test compatibility)')
    .option('-v, --version', 'Display version information')
    .parse(args)

  // Throw away the native -V flag in lieu of the one we've manually specified
  // to adhere to testing requirements
  program.options.shift()

  const files = program.args

  if (!files.length) {
    program.help()
  }

  files
    .map((filePath) => editorconfig.parse(filePath, {
      config: program.F,
      version: program.B,
    }))
    .forEach((parsing, i, { length }) => {
      parsing.then((parsed) => {
        if (length > 1) {
          console.log(`[${files[i]}]`)
        }
        Object.keys(parsed).forEach((key) => {
          console.log(`${key}=${parsed[key]}`)
        })
      })
    })
}
