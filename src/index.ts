import * as fs from 'fs'
import * as path from 'path'
import * as semver from 'semver'

import minimatch from './lib/fnmatch'
import { parseString, ParseStringResult } from './lib/ini'

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
  contents: ParseStringResult
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

function extendProps(props: {} = {}, options: {} = {}) {
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      const value = options[key]
      const key2 = key.toLowerCase()
      let value2 = value
      if (knownProps[key2]) {
        value2 = value.toLowerCase()
      }
      try {
        value2 = JSON.parse(value)
      } catch (e) {}
      if (typeof value === 'undefined' || value === null) {
        // null and undefined are values specific to JSON (no special meaning
        // in editorconfig) & should just be returned as regular strings.
        value2 = String(value)
      }
      props[key2] = value2
    }
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
          file.contents.forEach((section) => {
            const glob = section[0]
            const options2 = section[1]
            if (!glob) {
              return
            }
            const fullGlob = buildFullGlob(pathPrefix, glob)
            if (!fnmatch(filepath, fullGlob)) {
              return
            }
            matches = extendProps(matches, options2)
          })
          return matches
        },
        {},
      ),
    options.version as string,
  )
}

function getConfigsForFiles(files: ECFile[]) {
  const configs = []
  for (const i in files) {
    if (files.hasOwnProperty(i)) {
      const file = files[i]
      const contents = parseString(file.contents as string)
      configs.push({
        name: file.name,
        contents,
      })
      if ((contents[0][1].root || '').toLowerCase() === 'true') {
        break
      }
    }
  }
  return configs
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
