/* eslint-disable no-console */
// tslint:disable:no-console
import { createCommand } from 'commander'

import * as editorconfig from './'

import pkg from '../package.json'

export default function cli(args: string[]): void {
  const program = createCommand()

  program.version(
    'EditorConfig Node.js Core Version ' + pkg.version,
    '-v, --version',
    'Display version information'
  )
    .showHelpAfterError()
    .argument(
      '<FILEPATH...>',
      'Files to find configuration for.  Can be a hyphen (-) if you want path(s) to be read from stdin.'
    )
    .option('-f <path>',       'Specify conf filename other than \'.editorconfig\'')
    .option('-b <version>',    'Specify version (used by devs to test compatibility)')
    .parse(args)

  const files = program.args
  const opts = program.opts()

  Promise.all(
    files.map((filePath) => editorconfig.parse(filePath, {
      config: opts.f as string,
      version: opts.b as string,
    }))
  ).then((parsed) => {
    const header = parsed.length > 1
    parsed.forEach((props, i) => {
      if (header) {
        console.log(`[${files[i]}]`)
      }
      Object.keys(props).forEach((key) => {
        console.log(`${key}=${String(props[key])}`)
      })
    })
  }, er => {
    console.error(er)
  })
}
