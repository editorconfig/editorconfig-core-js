export interface ParserOptions {
  [key: string]: any;
  /**
   * Object that will be attached to the each `LocationRange` object created by
   * the parser. For example, this can be path to the parsed file or even the
   * File object.
   */
  grammarSource?: any;
  startRule?: string;
}

export function parse(input: string, options?: ParserOptions): any;
