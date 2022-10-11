/* eslint-disable @typescript-eslint/naming-convention */
import * as fs from 'fs'
import * as path from 'path'
import 'should'

import * as editorconfig from './'

describe('parse', () => {
  const expected: editorconfig.Props = {
    indent_style: 'space',
    indent_size: 2,
    end_of_line: 'lf',
    charset: 'utf-8',
    trim_trailing_whitespace: true,
    insert_final_newline: true,
    tab_width: 2,
    block_comment: '*',
    block_comment_end: '*/',
    block_comment_start: '/**',
  }
  const target = path.join(__dirname, '/app.js')

  it('async', async () => {
    const cfg = await editorconfig.parse(target)
    cfg.should.eql(expected)
  })

  it('sync', () => {
    const cfg = editorconfig.parseSync(target)
    cfg.should.eql(expected)
  })
})

describe('parseFromFiles', () => {
  const expected: editorconfig.Props = {
    block_comment_end: '*/',
    block_comment_start: '/**',
    block_comment: '*',
    charset: 'utf-8',
    end_of_line: 'lf',
    indent_size: 2,
    indent_style: 'space',
    insert_final_newline: true,
    tab_width: 2,
    trim_trailing_whitespace: true,
  }
  const configs: editorconfig.ECFile[] = []
  const configPath = path.resolve(__dirname, '../.editorconfig')
  configs.push({
    name: configPath,
    contents: fs.readFileSync(configPath),
  })
  const target = path.join(__dirname, '/app.js')

  it('async', async () => {
    const cfg: editorconfig.Props =
      await editorconfig.parseFromFiles(target, Promise.resolve(configs))
    cfg.should.eql(expected)
  })

  it('sync', () => {
    const cfg = editorconfig.parseFromFilesSync(target, configs)
    cfg.should.eql(expected)
  })

  it('handles null', () => {
    const cfg = editorconfig.parseFromFilesSync(target, [{
      name: configPath,
      contents: Buffer.from('[*]\nfoo = null\n'),
    }])
    cfg.should.eql({ foo: 'null' })
  })

  it('handles minimatch escapables', () => {
    // Note that this `#` does not actually test the /^#/ escaping logic,
    // because this path will go through a `path.dirname` before that happens.
    // It's here to catch what would happen if minimatch started to treat #
    // differently inside a pattern.
    const bogusPath = path.resolve(__dirname, '#?*+@!()|[]{}')
    const escConfigs: editorconfig.ECFile[] = [
      {
        name: `${bogusPath}/.editorconfig`,
        contents: configs[0].contents,
      },
    ]
    const escTarget = `${bogusPath}/app.js`
    const cfg = editorconfig.parseFromFilesSync(escTarget, escConfigs)
    cfg.should.eql(expected)
  })
})

describe('parseString', () => {
  const expected: editorconfig.ParseStringResult = [
    [null, { root: 'true' }],
    ['*', {
      block_comment_end: '*/',
      block_comment_start: '/**',
      block_comment: '*',
      charset: 'utf-8',
      end_of_line: 'lf',
      indent_size: '2',
      indent_style: 'space',
      insert_final_newline: 'true',
      trim_trailing_whitespace: 'true',
    }],
    ['*.md', { indent_size: '4' }],
  ]

  const configPath = path.resolve(__dirname, '../.editorconfig')
  const contents = fs.readFileSync(configPath, 'utf8')

  it('sync', () => {
    const cfg = editorconfig.parseString(contents)
    cfg.should.eql(expected)
  })

  it('handles errors', () => {
    const cfg = editorconfig.parseString('root: ')
    cfg.should.eql([[null, {}]])
  })
})
