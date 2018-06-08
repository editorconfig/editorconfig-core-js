import INIParser, { Property, Sections } from '@jedmao/ini-parser'
import * as fs from 'fs'
import * as path from 'path'
import * as semver from 'semver'

import minimatch from './lib/fnmatch'

const parser = new INIParser()
const parseString = parser.parse
export { parseString }

import pkg from '../package.json'

export interface KnownProps {
  end_of_line?: 'lf' | 'crlf' | 'unset'
  indent_style?: 'tab' | 'space' | 'unset'
  indent_size?: number | 'tab' | 'unset'
  insert_final_newline?: true | false | 'unset'
  tab_width?: number | 'unset'
  trim_trailing_whitespace?: true | false | 'unset'
  charset?: string | 'unset'
}

export interface ECFile {
  name: string
  contents: string | Buffer
}

export interface FileConfig {
  name: string
  contents: Sections
}

export interface ParseOptions {
  config?: string
  version?: string
  root?: string
}

const knownProps = {
  end_of_line: true,
  indent_style: true,
  indent_size: true,
  insert_final_newline: true,
  trim_trailing_whitespace: true,
  charset: true,
}

function fnmatch(filepath: string, glob: string) {
  const matchOptions = { matchBase: true, dot: true, noext: true }
  glob = glob.replace(/\*\*/g, '{*,**/**/**}')
  return minimatch(filepath, glob, matchOptions)
}

function getConfigFileNames(filepath: string, options: ParseOptions) {
  const paths = []
  do {
    filepath = path.dirname(filepath)
    paths.push(path.join(filepath, options.config as string))
  } while (filepath !== options.root)
  return paths
}

function processMatches(matches: KnownProps, version: string) {
  // Set indent_size to 'tab' if indent_size is unspecified and
  // indent_style is set to 'tab'.
  if (
    'indent_style' in matches
    && matches.indent_style === 'tab'
    && !('indent_size' in matches)
    && semver.gte(version, '0.10.0')
  ) {
    matches.indent_size = 'tab'
  }

  // Set tab_width to indent_size if indent_size is specified and
  // tab_width is unspecified
  if (
    'indent_size' in matches
    && !('tab_width' in matches)
    && matches.indent_size !== 'tab'
  ) {
    matches.tab_width = matches.indent_size
  }

  // Set indent_size to tab_width if indent_size is 'tab'
  if (
    'indent_size' in matches
    && 'tab_width' in matches
    && matches.indent_size === 'tab'
  ) {
    matches.indent_size = matches.tab_width
  }

  return matches
}

function processOptions(options: ParseOptions = {}, filepath: string) {
  return {
    config: options.config || '.editorconfig',
    version: options.version || pkg.version,
    root: path.resolve(options.root || path.parse(filepath).root),
  }
}

function buildFullGlob(pathPrefix: string, glob: string) {
  switch (glob.indexOf('/')) {
    case -1:
      glob = '**/' + glob
      break
    case 0:
      glob = glob.substring(1)
      break
    default:
      break
  }
  return path.join(pathPrefix, glob)
}

function extendProps(props: {}, iniProps: Property[]) {
  for (const prop of iniProps) {
    const lkey = prop.key.toLowerCase()
    const value = (knownProps[lkey])
      ? prop.value.toLowerCase && prop.value.toLowerCase()
      : prop.value
    props[lkey] = (typeof value === 'undefined' || value === null)
      // null and undefined are values specific to JSON (no special meaning
      // in editorconfig) & should just be returned as regular strings.
      ? String(value)
      : value
  }
  return props
}

function parseFromConfigs(
  configs: FileConfig[],
  filepath: string,
  options: ParseOptions,
) {
  return processMatches(
    configs
      .reverse()
      .reduce(
        (matches: KnownProps, file) => {
          const pathPrefix = path.dirname(file.name)
          file.contents.items.forEach((section) => {
            if (!section.name) {
              return
            }
            const fullGlob = buildFullGlob(pathPrefix, section.name)
            if (!fnmatch(filepath, fullGlob)) {
              return
            }
            matches = extendProps(
              matches,
              section.nodes.filter((node) => (node as Property).key) as Property[],
            )
          })
          return matches
        },
        {},
      ),
    options.version as string,
  )
}

function getConfigsForFiles(files: ECFile[]) {
  const configs: FileConfig[] = []
  for (const file of files) {
    if (!file.contents) {
      continue
    }
    const contents = parser.parse(file.contents as string)
    configs.push({
      name: file.name,
      contents,
    })
    if (isRootTrue(contents)) {
      break
    }
  }
  return configs

  function isRootTrue(sections: Sections) {
    return sections.items.some(
      (section) => !section.name && section.nodes.some(
        (prop: Property) => prop.key === 'root' && prop.value === true,
      ),
    )
  }
}

async function readConfigFiles(filepaths: string[]) {
  return Promise.all(
    filepaths.map((name) => new Promise((resolve) => {
      fs.readFile(name, 'utf8', (err, data) => {
        resolve({
          name,
          contents: err ? '' : data,
        })
      })
    })),
  )
}

function readConfigFilesSync(filepaths: string[]) {
  const files: ECFile[] = []
  let file: string | number | Buffer
  filepaths.forEach((filepath) => {
    try {
      file = fs.readFileSync(filepath, 'utf8')
    } catch (e) {
      file = ''
    }
    files.push({
      name: filepath,
      contents: file,
    })
  })
  return files
}

function opts(filepath: string, options: ParseOptions = {}): [
  string,
  ParseOptions
] {
  const resolvedFilePath = path.resolve(filepath)
  return [
    resolvedFilePath,
    processOptions(options, resolvedFilePath),
  ]
}

export async function parseFromFiles(
  filepath: string,
  files: Promise<ECFile[]>,
  options: ParseOptions = {},
) {
  const [resolvedFilePath, processedOptions] = opts(filepath, options)
  return files.then(getConfigsForFiles)
    .then((configs) => parseFromConfigs(
      configs,
      resolvedFilePath,
      processedOptions,
    ))
}

export function parseFromFilesSync(
  filepath: string,
  files: ECFile[],
  options: ParseOptions = {},
) {
  const [resolvedFilePath, processedOptions] = opts(filepath, options)
  return parseFromConfigs(
    getConfigsForFiles(files),
    resolvedFilePath,
    processedOptions,
  )
}

export async function parse(_filepath: string, _options: ParseOptions = {}) {
  const [resolvedFilePath, processedOptions] = opts(_filepath, _options)
  const filepaths = getConfigFileNames(resolvedFilePath, processedOptions)
  return readConfigFiles(filepaths)
    .then(getConfigsForFiles)
    .then((configs) => parseFromConfigs(
      configs,
      resolvedFilePath,
      processedOptions,
    ))
}

export function parseSync(_filepath: string, _options: ParseOptions = {}) {
  const [resolvedFilePath, processedOptions] = opts(_filepath, _options)
  const filepaths = getConfigFileNames(resolvedFilePath, processedOptions)
  const files = readConfigFilesSync(filepaths)
  return parseFromConfigs(
    getConfigsForFiles(files),
    resolvedFilePath,
    processedOptions,
  )
}
