/* eslint-disable @typescript-eslint/no-deprecated */
import * as editorconfig from './index.js';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {expect, should} from 'chai';
import {Buffer} from 'node:buffer';
import process from 'node:process';

should();

describe('parse', () => {
  const expected: editorconfig.Props = Object.assign(Object.create(null), {
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
  });
  const target = path.join(__dirname, '/app.js');

  it('async', async () => {
    const cfg = await editorconfig.parse(target);
    expect(cfg).to.eql(expected);
  });

  it('sync', () => {
    const visited: editorconfig.Visited[] = [];
    const cfg = editorconfig.parseSync(target, {files: visited});
    expect(cfg).to.eql(expected);
    visited.should.have.lengthOf(1);
    visited[0].glob.should.eql('*');
    visited[0].fileName.should.match(/\.editorconfig$/);
  });

  it('stops at the filesystem root when the configured root is not an ancestor', async () => {
    const root = path.join(__dirname, 'not-an-ancestor');
    const cfg = await editorconfig.parse(target, {root});
    expect(cfg).to.eql(expected);
  });

  it('stops at the filesystem root synchronously when the configured root is not an ancestor', () => {
    const root = path.join(__dirname, 'not-an-ancestor');
    const cfg = editorconfig.parseSync(target, {root});
    expect(cfg).to.eql(expected);
  });

  const windowsIt = process.platform === 'win32' ? it : it.skip;

  windowsIt('parses Windows extended-length paths', async () => {
    const cfg = await editorconfig.parse(path.toNamespacedPath(target));
    expect(cfg).to.eql(expected);
  });

  windowsIt('parses Windows extended-length paths synchronously', () => {
    const cfg = editorconfig.parseSync(path.toNamespacedPath(target));
    expect(cfg).to.eql(expected);
  });

  it('caches', async () => {
    const cache = new Map();
    const cfg = await editorconfig.parse(target, {cache});
    expect(cfg).to.eql(expected);
    cache.size.should.be.eql(2);
    await editorconfig.parse(target, {cache});
    cache.size.should.be.eql(2);
  });

  it('caches sync', () => {
    const cache = new Map();
    const cfg = editorconfig.parseSync(target, {cache});
    expect(cfg).to.eql(expected);
    cache.size.should.be.eql(2);
    editorconfig.parseSync(target, {cache});
    cache.size.should.be.eql(2);
  });
});

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
  };
  const configs: editorconfig.ECFile[] = [];
  const configPath = path.resolve(__dirname, '../.editorconfig');
  configs.push({
    name: configPath,
    contents: fs.readFileSync(configPath),
  });
  const target = path.join(__dirname, '/app.js');
  const configs2 = [
    {name: 'early', contents: Buffer.alloc(0)},
    configs[0],
  ];

  it('async', async () => {
    const cfg: editorconfig.Props =
      await editorconfig.parseFromFiles(target, Promise.resolve(configs));
    expect(cfg).to.eql(expected);
  });

  it('sync', () => {
    const cfg = editorconfig.parseFromFilesSync(target, configs);
    expect(cfg).to.eql(expected);
  });

  it('handles null', () => {
    const cfg = editorconfig.parseFromFilesSync(target, [{
      name: configPath,
      contents: Buffer.from('[*]\nfoo = null\n'),
    }]);
    expect(cfg).to.eql({foo: 'null'});
  });

  it('caches async', async () => {
    const cache = new Map();
    const cfg = await editorconfig.parseFromFiles(
      target, Promise.resolve(configs2), {cache}
    );
    expect(cfg).to.eql(expected);
    cache.size.should.be.eql(2);
    const cfg2 = await editorconfig.parseFromFiles(
      target, Promise.resolve(configs2), {cache}
    );
    expect(cfg2).to.eql(expected);
    cache.size.should.be.eql(2);
  });

  it('caches sync', () => {
    const cache = new Map();
    const cfg = editorconfig.parseFromFilesSync(
      target, configs2, {cache}
    );
    expect(cfg).to.eql(expected);
    cache.size.should.be.eql(2);
    const cfg2 = editorconfig.parseFromFilesSync(
      target, configs2, {cache}
    );
    expect(cfg2).to.eql(expected);
    cache.size.should.be.eql(2);
  });

  it('handles minimatch escapables', () => {
    // Note that this `#` does not actually test the /^#/ escaping logic,
    // because this path will go through a `path.dirname` before that happens.
    // It's here to catch what would happen if minimatch started to treat #
    // differently inside a pattern.
    const bogusPath = path.resolve(__dirname, '#?*+@!()|[]{}');
    const escConfigs: editorconfig.ECFile[] = [
      {
        name: `${bogusPath}/.editorconfig`,
        contents: configs[0].contents,
      },
    ];
    const escTarget = `${bogusPath}/app.js`;
    const cfg = editorconfig.parseFromFilesSync(escTarget, escConfigs);
    expect(cfg).to.eql(expected);
  });
});

describe('parseString', () => {
  const expected: editorconfig.ParseStringResult = [
    [null, {root: 'true'}],
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
    ['*.md', {indent_size: '4'}],
  ];

  const configPath = path.resolve(__dirname, '../.editorconfig');
  const contents = fs.readFileSync(configPath, 'utf8');

  it('sync', () => {
    const cfg = editorconfig.parseString(contents);
    expect(cfg).to.eql(expected);
  });

  it('handles errors', () => {
    const cfg = editorconfig.parseString('root: ');
    expect(cfg).to.eql([[null, Object.create(null)]]);
  });

  it('handles backslashes in glob', () => {
    const cfg = editorconfig.parseString('[a\\\\b]');
    expect(cfg).to.eql([[null, {}], ['a\\\\b', Object.create(null)]]);
  });

  it('handles blank comments', () => {
    const cfg = editorconfig.parseString('#');
    expect(cfg).to.eql([[null, Object.create(null)]]);
  });

  it('handles __proto__', () => {
    const cfg = editorconfig.parseString('__proto__ = foo');
    const obj = Object.create(null);
    // eslint-disable-next-line no-proto
    obj.__proto__ = 'foo';
    expect(cfg).to.eql([[null, obj]]);
  });
});

describe('parent directory components in section globs', () => {
  let dir = '';
  let target = '';

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'editorconfig-'));
    target = path.join(dir, 'x.c');
    fs.writeFileSync(target, '');
  });

  after(() => {
    fs.rmSync(dir, {recursive: true, force: true});
  });

  /**
   * Write a one-section config and return the properties for `x.c`.
   *
   * @param glob Section name to test.
   * @returns Properties found for the target file.
   */
  function configFor(glob: string): editorconfig.Props {
    fs.writeFileSync(
      path.join(dir, '.editorconfig'),
      `root = true\n\n[${glob}]\nhit = yes\n`
    );
    return editorconfig.parseSync(target);
  }

  it('does not let a `..` component consume a directory', () => {
    // `[dir/../x.c]` must not match `x.c`, which is not inside `dir`.
    expect(configFor('dir/../x.c')).to.not.have.property('hit');
    expect(configFor('a/../b/../x.c')).to.not.have.property('hit');
    expect(configFor('**/../x.c')).to.not.have.property('hit');
    expect(configFor('../x.c')).to.not.have.property('hit');
    expect(configFor('./x.c')).to.not.have.property('hit');
  });

  it('still matches a plain name and a `**` pattern', () => {
    expect(configFor('x.c')).to.have.property('hit', 'yes');
    expect(configFor('**/x.c')).to.have.property('hit', 'yes');
    expect(configFor('*.c')).to.have.property('hit', 'yes');
  });

  it('treats an escaped `..` as a literal name', () => {
    // `a\.\.` is a file called `a..`, not a parent-directory reference.
    expect(configFor('a\\.\\.c')).to.not.have.property('hit');
  });

  it('does not match through the async parse either', async () => {
    fs.writeFileSync(
      path.join(dir, '.editorconfig'),
      'root = true\n\n[dir/../x.c]\nhit = yes\n'
    );
    const cfg = await editorconfig.parse(target);
    expect(cfg).to.not.have.property('hit');
  });
});

describe('extra behavior', () => {
  it('handles extended globs', () => {
    // These failed when we had noext: true in matchOptions
    const matcher = editorconfig.matcher({
      root: __dirname,
    }, Buffer.from(`\
[*]
indent_size = 4

[!(package).json]
indent_size = 3`));

    expect(matcher(path.join(__dirname, 'package.json'))).to.include({indent_size: 4});
    expect(matcher(path.join(__dirname, 'foo.json'))).to.include({indent_size: 3});
  });
});

describe('unset', () => {
  it('pair with the value `unset`', () => {
    const matcher = editorconfig.matcher({
      root: __dirname,
      unset: true,
    }, Buffer.from(`\
[*]
indent_size = 4

[*.json]
indent_size = unset
`));

    expect(matcher(path.join(__dirname, 'index.js'))).to.include({indent_size: 4});
    expect(matcher(path.join(__dirname, 'index.json'))).to.be.eql(Object.create(null));
  });
});
