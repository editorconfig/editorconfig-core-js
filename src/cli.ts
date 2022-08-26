// tslint:disable:no-console
import { createCommand } from 'commander'

import * as editorconfig from './'

import pkg from '../package.json'

const program = createCommand()

export default function cli(args: string[]) {
  program.version(
    'EditorConfig Node.js Core Version ' + pkg.version,
    '-v, --version',
    'Display version information',
  )

  program
    .usage([
        '[OPTIONS] FILEPATH1 [FILEPATH2 FILEPATH3 ...]',
        'FILEPATH can be a hyphen (-) if you want path(s) to be read from stdin.',
      ].join('\n\n  '))
    .option('-f <path>',     'Specify conf filename other than \'.editorconfig\'')
    .option('-b <version>',  'Specify version (used by devs to test compatibility)')
    .parse(args)

  const files = program.args
  const opts = program.opts()

  if (!files.length) {
    program.help()
  }

  files
    .map((filePath) => editorconfig.parse(filePath, {
      config: opts.f,
      version: opts.b,
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
