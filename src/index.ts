import * as fs from 'fs'
import * as path from 'path'
import * as semver from 'semver'

import minimatch from 'minimatch'
import { parse_to_uint32array, TokenTypes } from '@one-ini/wasm'

// @ts-ignore So we can set the rootDir to be 'lib', without processing
// package.json
import pkg from '../package.json'

const escapedSep = new RegExp(path.sep.replace(/\\/g, '\\\\'), 'g')
export const FILES = Symbol('FILES')

// These are specified by the editorconfig script
/* eslint-disable @typescript-eslint/naming-convention */
export interface KnownProps {
  end_of_line?: 'lf' | 'crlf' | 'unset'
  indent_style?: 'tab' | 'space' | 'unset'
  indent_size?: number | 'tab' | 'unset'
  insert_final_newline?: true | false | 'unset'
  tab_width?: number | 'unset'
  trim_trailing_whitespace?: true | false | 'unset'
  charset?: string | 'unset'
  [FILES]: string[]
}
/* eslint-enable @typescript-eslint/naming-convention */

interface UnknownMap {
  [index: string]: unknown
}
export type Props = KnownProps & UnknownMap

export interface ECFile {
  name: string
  contents?: Buffer
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

// These are specified by the editorconfig script
/* eslint-disable @typescript-eslint/naming-convention */
const knownProps = {
  end_of_line: true,
  indent_style: true,
  indent_size: true,
  insert_final_newline: true,
  trim_trailing_whitespace: true,
  charset: true,
}
/* eslint-enable @typescript-eslint/naming-convention */

export type SectionName = string | null
export interface SectionBody { [key: string]: string }
export type ParseStringResult = [SectionName, SectionBody][]

export function parseBuffer(data: Buffer): ParseStringResult {
  const parsed = parse_to_uint32array(data)
  let cur: SectionBody = {}
  const res: ParseStringResult = [[null, cur]]
  let key: string | null = null

  for (let i = 0; i < parsed.length; i += 3) {
    switch (parsed[i]) {
    case TokenTypes.Section: {
      cur = {}
      res.push([
        data
          .toString('utf8', parsed[i+1], parsed[i+2])
          .replace(/\\\\/g, '\\\\\\\\'),
        cur,
      ])
      break
    }
    case TokenTypes.Key:
      key = data.toString('utf8', parsed[i+1], parsed[i+2])
      break
    case TokenTypes.Value: {
      cur[key as string] = data.toString('utf8', parsed[i+1], parsed[i+2])
      break
    }
    default:
      break
    }
  }
  return res
}

export function parseString(data: string): ParseStringResult {
  return parseBuffer(Buffer.from(data))
}

function fnmatch(filepath: string, glob: string): boolean {
  const matchOptions = { matchBase: true, dot: true, noext: true }
  glob = glob.replace(/\*\*/g, '{*,**/**/**}')
  return minimatch(filepath, glob, matchOptions)
}

function getConfigFileNames(filepath: string, options: ParseOptions): string[] {
  const paths = []
  do {
    filepath = path.dirname(filepath)
    paths.push(path.join(filepath, options.config as string))
  } while (filepath !== options.root)
  return paths
}

function processMatches(matches: Props, version: string): Props {
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

function processOptions(
  options: ParseOptions = {},
  filepath: string
): ParseOptions {
  return {
    config: options.config || '.editorconfig',
    version: options.version || pkg.version,
    root: path.resolve(options.root || path.parse(filepath).root),
  }
}

function buildFullGlob(pathPrefix: string, glob: string): string {
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
  // NOT path.join.  Must stay in forward slashes.
  return `${pathPrefix}/${glob}`
}

function extendProps(props: Props, options: SectionBody): Props {
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      const value = options[key]
      const key2 = key.toLowerCase()
      let value2: unknown = value
      if (knownProps[key2]) {
        // All of the values for the known props are lowercase.
        value2 = String(value).toLowerCase()
      }
      try {
        value2 = JSON.parse(String(value))
      } catch (e) {}
      if (typeof value2 === 'undefined' || value2 === null) {
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
  options: ParseOptions
): Props {
  return processMatches(
    configs
      .reverse()
      .reduce(
        (matches: Props, file) => {
          let pathPrefix = path.dirname(file.name)

          if (path.sep !== '/') {
            pathPrefix = pathPrefix.replace(escapedSep, '/')
          }

          // After Windows path backslash's are turned into slashes, so that
          // the backslashes we add here aren't turned into forward slashes:

          // All of these characters are special to minimatch, but can be
          // forced into path names on many file systems.  Escape them. Note
          // that these are in the order of the case statement in minimatch.
          pathPrefix = pathPrefix.replace(/[?*+@!()|[\]{}]/g, '\\$&')
          // I can't think of a way for this to happen in the filesystems I've
          // seen (because of the path.dirname above), but let's be thorough.
          pathPrefix = pathPrefix.replace(/^#/, '\\#')

          file.contents.forEach(([glob, options2]) => {
            if (!glob) {
              return
            }
            const fullGlob = buildFullGlob(pathPrefix, glob)
            if (!fnmatch(filepath, fullGlob)) {
              return
            }
            matches[FILES].push(file.name)
            matches = extendProps(matches, options2)
          })
          return matches
        },
        { [FILES]: [] }
      ),
    options.version as string
  )
}

function getConfigsForFiles(files: ECFile[]): FileConfig[] {
  const configs: FileConfig[] = []
  for (const file of files) {
    if (file.contents) {
      const contents = parseBuffer(file.contents)
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

async function readConfigFiles(filepaths: string[]): Promise<ECFile[]> {
  return Promise.all<ECFile>(
    filepaths.map((name) => new Promise((resolve) => {
      fs.readFile(name, (_, contents) => {
        // Ignore errors.  contents will be undefined
        resolve({ name, contents })
      })
    }))
  )
}

function readConfigFilesSync(filepaths: string[]): ECFile[] {
  const files: ECFile[] = []
  filepaths.forEach((name) => {
    try {
      const contents = fs.readFileSync(name)
      files.push({ name, contents })
    } catch (_) {
      // Ignored
    }
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
  options: ParseOptions = {}
): Promise<Props> {
  const [resolvedFilePath, processedOptions] = opts(filepath, options)
  return files.then(getConfigsForFiles)
    .then((configs) => parseFromConfigs(
      configs,
      resolvedFilePath,
      processedOptions
    ))
}

export function parseFromFilesSync(
  filepath: string,
  files: ECFile[],
  options: ParseOptions = {}
): Props {
  const [resolvedFilePath, processedOptions] = opts(filepath, options)
  return parseFromConfigs(
    getConfigsForFiles(files),
    resolvedFilePath,
    processedOptions
  )
}

export async function parse(
  _filepath: string,
  _options: ParseOptions = {}
): Promise<Props> {
  const [resolvedFilePath, processedOptions] = opts(_filepath, _options)
  const filepaths = getConfigFileNames(resolvedFilePath, processedOptions)
  return readConfigFiles(filepaths)
    .then(getConfigsForFiles)
    .then((configs) => parseFromConfigs(
      configs,
      resolvedFilePath,
      processedOptions
    ))
}

export function parseSync(
  _filepath: string,
  _options: ParseOptions = {}
): Props {
  const [resolvedFilePath, processedOptions] = opts(_filepath, _options)
  const filepaths = getConfigFileNames(resolvedFilePath, processedOptions)
  const files = readConfigFilesSync(filepaths)
  return parseFromConfigs(
    getConfigsForFiles(files),
    resolvedFilePath,
    processedOptions
  )
}
