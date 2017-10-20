// Based on iniparser by shockie <https://npmjs.org/package/iniparser>

import * as fs from 'fs'
import { URL } from 'url'

/**
 * define the possible values:
 * section: [section]
 * param: key=value
 * comment: ;this is a comment
 */
const regex = {
  section: /^\s*\[(([^#;]|\\#|\\;)+)\]\s*([#;].*)?$/,
  param: /^\s*([\w\.\-\_]+)\s*[=:]\s*(.*?)\s*([#;].*)?$/,
  comment: /^\s*[#;].*$/,
}

/**
 * Parses an .ini file
 * @param file The location of the .ini file
 */
export async function parse(file: string | number | Buffer | URL) {
  return new Promise<ParseStringResult>(
    (resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err)
          return
        }
        resolve(parseString(data))
      })
    },
  )
}

export function parseSync(file: string | number | Buffer | URL) {
  return parseString(fs.readFileSync(file, 'utf8'))
}

export type SectionName = string | null
export interface SectionBody { [key: string]: string }
export type ParseStringResult = Array<[SectionName, SectionBody]>

export function parseString(data: string): ParseStringResult {
  let sectionBody: SectionBody = {}
  let sectionName: SectionName = null
  const value: ParseStringResult = [[sectionName, sectionBody]]
  const lines = data.split(/\r\n|\r|\n/)
  lines.forEach((line) => {
    let match: RegExpMatchArray | null
    if (regex.comment.test(line)) {
      return
    }
    if (regex.param.test(line)) {
      match = line.match(regex.param)
      sectionBody[(match as RegExpMatchArray)[1]] =
        (match as RegExpMatchArray)[2]
    } else if (regex.section.test(line)) {
      match = line.match(regex.section)
      sectionName = (match as RegExpMatchArray)[1]
      sectionBody = {}
      value.push([sectionName, sectionBody])
    }
  })
  return value
}
