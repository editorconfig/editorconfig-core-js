import { expect } from 'chai'
import * as fs from 'fs'
import * as path from 'path'

import * as editorconfig from './'

describe('parse', () => {
  const expected: editorconfig.KnownProps = {
    indent_style: 'space',
    indent_size: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
    tab_width: 2,
  }
  const target = path.join(__dirname, '/app.js')

  it('async', async () => {
    expect(await editorconfig.parse(target)).to.eq(expected)
  })

  it('sync', () => {
    expect(editorconfig.parseSync(target)).to.eq(expected)
  })
})

describe('parseFromFiles', () => {
  const expected: editorconfig.KnownProps = {
    indent_style: 'space',
    indent_size: 2,
    tab_width: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
  }
  const configs: editorconfig.ECFile[] = []
  const configPath = path.resolve(__dirname, '../.editorconfig')
  configs.push({
    name: configPath,
    contents: fs.readFileSync(configPath, 'utf8'),
  })
  const target = path.join(__dirname, '/app.js')

  it('async', async () => {
    expect(
      await editorconfig.parseFromFiles(target, Promise.resolve(configs)),
    ).to.eq(expected)
  })

  it('sync', () => {
    expect(editorconfig.parseFromFilesSync(target, configs)).to.eq(expected)
  })
})

describe('parseString', () => {
  const expected: editorconfig.KnownProps = {
    indent_style: 'space',
    indent_size: 2,
    tab_width: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
  }

  const configPath = path.resolve(__dirname, '../.editorconfig')
  const contents = fs.readFileSync(configPath, 'utf8')

  it('sync', () => {
    expect(editorconfig.parseString(contents)).to.eq(expected)
  })
})
