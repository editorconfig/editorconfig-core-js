import { Command, type OutputConfiguration } from 'commander'

import * as editorconfig from './'

import pkg from '../package.json'

function writeStdOut(s: string): void {
  process.stdout.write(s)
}

export default function cli(
  args: string[],
  testing?: OutputConfiguration
): Promise<editorconfig.Props[]> {
  const program = new Command()

  let writeOut = writeStdOut

  if (testing) {
    if (testing.writeOut) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      writeOut = testing.writeOut
    }
    program.configureOutput(testing)
    program.exitOverride()
  }

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
    .option('--files',         'Output file names that contributed to the configuration, rather than the configuation itself')
    .parse(args)

  const files = program.args
  const opts = program.opts()

  return Promise.all(
    files.map((filePath) => editorconfig.parse(filePath, {
      config: opts.f as string,
      version: opts.b as string,
    }))
  ).then((parsed) => {
    const header = parsed.length > 1
    const seen = new Set()
    parsed.forEach((props, i) => {
      if (opts.files) {
        for (const name of props[editorconfig.FILES]) {
          // Seeing duplicate file names for each section that matches isn't
          // interesting.
          if (!seen.has(name)) {
            writeOut(name)
            writeOut('\n')
            seen.add(name)
          }
        }
      } else {
        if (header) {
          writeOut(`[${files[i]}]\n`)
        }
        Object.keys(props).forEach((key) => {
          writeOut(`${key}=${String(props[key])}\n`)
        })
      }
    })
    return parsed
  })
}
