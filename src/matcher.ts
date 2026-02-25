/* eslint-disable */
import * as path from 'node:path';

import {matcher as micromatchMatcher} from 'micromatch';

const escapedSep = new RegExp(path.sep.replace(/\\/g, '\\\\'), 'g');

export interface MinimatchOptions {
  dot?: boolean;
  matchBase?: boolean;
}

function findExpandableBrace(pattern: string): {
  start: number;
  end: number;
  body: string;
} | null {
  let escape = false;
  let bracketDepth = 0;

  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch !== '{' || bracketDepth > 0) {
      continue;
    }

    const end = findMatchingBrace(pattern, i + 1);
    if (end === -1) {
      continue;
    }
    const body = pattern.slice(i + 1, end);
    if (isExpandableBody(body)) {
      return {start: i, end, body};
    }
    i = end;
  }

  return null;
}

function findMatchingBrace(pattern: string, start: number): number {
  let depth = 0;
  let escape = false;
  let bracketDepth = 0;

  for (let i = start; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (bracketDepth > 0) {
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      if (depth === 0) {
        return i;
      }
      depth -= 1;
    }
  }
  return -1;
}

function isExpandableBody(body: string): boolean {
  return hasTopLevelComma(body) || expandNumericRange(body) !== null;
}

function hasTopLevelComma(body: string): boolean {
  let escape = false;
  let depth = 0;
  let bracketDepth = 0;

  for (const ch of body) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (bracketDepth > 0) {
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === ',' && depth === 0) {
      return true;
    }
  }
  return false;
}

function expandNumericRange(body: string): string[] | null {
  let escape = false;
  let depth = 0;
  let bracketDepth = 0;
  const chars = [...body];

  for (const [i, ch] of chars.entries()) {
    if (i >= chars.length - 1) {
      break;
    }
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (bracketDepth > 0) {
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0 && chars[i] === '.' && chars[i + 1] === '.') {
      const left = chars.slice(0, i).join('');
      const right = chars.slice(i + 2).join('');
      if (!/^[-]?\d+$/.test(left) || !/^[-]?\d+$/.test(right)) {
        return null;
      }
      const start = Number(left);
      const end = Number(right);
      const step = start <= end ? 1 : -1;
      const range: string[] = [];
      for (
        let value = start;
        step > 0 ? value <= end : value >= end;
        value += step
      ) {
        range.push(String(value));
      }
      return range;
    }
  }

  return null;
}

function splitBraceBody(body: string): string[] {
  const parts: string[] = [];
  let current = '';
  let escape = false;
  let depth = 0;
  let bracketDepth = 0;

  for (const ch of body) {
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }
    if (ch === '\\') {
      current += ch;
      escape = true;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      current += ch;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += ch;
      continue;
    }
    if (bracketDepth === 0) {
      if (ch === '{') {
        depth += 1;
        current += ch;
        continue;
      }
      if (ch === '}') {
        depth = Math.max(0, depth - 1);
        current += ch;
        continue;
      }
      if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}

function unescapeBracePart(part: string): string {
  return part.replace(/\\(?<escaped>[\\{},])/g, '$<escaped>');
}

function expandBraces(pattern: string): string[] {
  const results: string[] = [];
  const queue: string[] = [pattern];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const brace = findExpandableBrace(current);
    if (!brace) {
      results.push(current);
      continue;
    }

    const {start, end, body} = brace;
    const pre = current.slice(0, start);
    const post = current.slice(end + 1);

    const range = expandNumericRange(body);
    const parts = range ?? splitBraceBody(body);
    for (const part of parts) {
      queue.push(pre + unescapeBracePart(part) + post);
    }
  }

  return results;
}

function normalizeBracketSlashes(pattern: string): string {
  let result = '';
  let escape = false;

  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === '\\') {
      result += ch;
      escape = true;
      continue;
    }
    if (ch !== '[') {
      result += ch;
      continue;
    }

    let inner = '';
    let innerEscape = false;
    let hasSlash = false;
    let foundEnd = false;

    for (let j = i + 1; j < pattern.length; j += 1) {
      const innerCh = pattern[j];
      if (innerEscape) {
        inner += innerCh;
        innerEscape = false;
        continue;
      }
      if (innerCh === '\\') {
        inner += innerCh;
        innerEscape = true;
        continue;
      }
      if (innerCh === ']') {
        foundEnd = true;
        i = j;
        break;
      }
      if (innerCh === '/') {
        hasSlash = true;
      }
      inner += innerCh;
    }

    if (!foundEnd) {
      result += '\\[';
      continue;
    }

    if (hasSlash) {
      result += `\\[${inner}\\]`;
    } else {
      result += `[${inner}]`;
    }
  }

  return result;
}

function hasPathSeparator(pattern: string): boolean {
  let escape = false;
  let bracketDepth = 0;

  for (const ch of pattern) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '[') {
      bracketDepth += 1;
      continue;
    }
    if (ch === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === '/' && bracketDepth === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Wrapper around micromatch to provide a Minimatch-compatible API.
 * Matches are evaluated against paths relative to the config directory.
 */
export class Minimatch {
  private baseDir: string;
  private matchBase: boolean;
  private hasPathSeparator: boolean;
  private matchFns: ((str: string) => boolean)[];

  public constructor(
    baseDir: string,
    pattern: string,
    options?: MinimatchOptions
  ) {
    this.baseDir = baseDir;
    this.matchBase = options?.matchBase ?? false;
    const normalizedPattern = normalizeBracketSlashes(pattern);
    this.hasPathSeparator = hasPathSeparator(normalizedPattern);
    const expandedPatterns = expandBraces(normalizedPattern);
    this.matchFns = expandedPatterns.map(expanded => micromatchMatcher(expanded, {
      dot: options?.dot ?? false,
      bash: false,
      posix: true,
      strictBrackets: false,
      nobrace: true,
    }));
  }

  public match(filepath: string): boolean {
    let normalized = filepath;
    if (path.sep !== '/') {
      normalized = normalized.replace(escapedSep, '/');
    }
    if (!normalized.startsWith(this.baseDir)) {
      return false;
    }
    let relativePath = normalized.slice(this.baseDir.length);
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1);
    }
    if (this.matchBase && !this.hasPathSeparator) {
      const baseName = relativePath.split('/').pop() ?? '';
      return this.matchFns.some(fn => fn(baseName));
    }
    return this.matchFns.some(fn => fn(relativePath));
  }
}
