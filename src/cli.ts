import { Command, type OutputConfiguration } from 'commander'

import * as editorconfig from './'

import pkg from '../package.json'

/**
 * Default output routine, goes to stdout.
 *
 * @param s String to output
 */
function writeStdOut(s: string): void {
  process.stdout.write(s)
}

/**
 * Command line interface for editorconfig.  Pulled out into a separate module
 * to make it easier to test.
 *
 * @param args Usually process.argv.  Note that the first two parameters are
 * usually 'node' and 'editorconfig'
 * @param testing If testing, you may pass in a Commander OutputConfiguration
 * so that you can capture stdout and stderror.  If `testing` is provided,
 * this routine will throw an error instead of calling `process.exit`.
 * @returns An array of combined properties, one for each file argument.
 */
export default async function cli(
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
  const cache = new Map<string, editorconfig.ProcessedFileConfig>()
  const visited = opts.files ?
    files.map<editorconfig.Visited[]>(() => []) :
    undefined

  // Process sequentially so caching works
  async function processAll(): Promise<editorconfig.Props[]> {
    const p = []
    let i = 0
    for (const filePath of files) {
      p.push(await editorconfig.parse(filePath, {
        config: opts.f as string,
        version: opts.b as string,
        files: visited ? visited[i++] : undefined,
        cache,
      }))
    }
    return p
  }

  return await processAll().then((parsed) => {
    const header = parsed.length > 1
    parsed.forEach((props, i) => {
      if (header) {
        writeOut(`[${files[i]}]\n`)
      }
      if (visited) {
        for (const v of visited[i]) {
          writeOut(`${v.fileName} [${v.glob}]\n`)
        }
      } else {
        for (const [key, value] of Object.entries(props)) {
          writeOut(`${key}=${String(value)}\n`)
        }
      }
    })
    return parsed
  })
}
