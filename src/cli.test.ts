import 'chai/register-should.js';
import type {Props} from './index.js';
import cli from './cli.js';

interface Results {
  props?: Props[];
  stdout: string;
  stderr: string;
  err?: unknown;
}

async function exec(...args: string[]): Promise<Results> {
  const out: string[] = [];
  const err: string[] = [];

  const res: Results = {
    stdout: '',
    stderr: '',
  };

  try {
    res.props = await cli(['node', 'editorconfig', ...args], {
      writeOut(s: string) {
        out.push(s);
      },
      writeErr(s: string) {
        err.push(s);
      },
    });
  } catch (er) {
    res.err = er;
  }
  if (out.length) {
    res.stdout = out.join('');
  }
  if (err.length) {
    res.stderr = err.join('');
  }
  return res;
}

describe('Command line interface', () => {
  it('helps', async () => {
    const res = await exec('--help');
    res.stdout.should.match(/^Usage:/);
  });

  it('Lists files', async () => {
    const res = await exec('foo.md', '--files');
    res.stdout.trim().should.match(/\.editorconfig \[\*\.md\]$/);
  });

  it('Lists multiple files', async () => {
    const res = await exec('foo.md', 'bar.js', '--files');
    res.stdout.should.match(/^\[foo\.md\]/);
    res.stdout.trim().should.match(/\.editorconfig \[\*\]$/);
  });
});
