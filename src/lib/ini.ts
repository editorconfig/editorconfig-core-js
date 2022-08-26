import * as fs from 'fs'
import { URL } from 'url'
import { parse as peggyParse } from './iniFile'

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
        resolve(parseString(data, file))
      })
    },
  )
}

export function parseSync(file: string | number | Buffer | URL) {
  return parseString(fs.readFileSync(file, 'utf8'), file)
}

export type SectionName = string | null
export interface SectionBody { [key: string]: string }
export type ParseStringResult = Array<[SectionName, SectionBody]>

export function parseString(data: string, file: string | number | Buffer | URL): ParseStringResult {
  const grammarSource = String(file)
  try {
    return peggyParse(data, { grammarSource })
  } catch (er) {
    if (typeof er.format === 'function') {
      er.message = er.format([{ source: grammarSource, text: data }])
    }
    throw er
  }
}
