{{
// We're only claiming to support node 12.22+, which has Object.fromEntries,
// but with this addition, the tests pass on node 8 still.  However, the build
// infrastructure won't work on pre-12, so we aren't testing it in CI.
const toObject = (typeof Object.fromEntries === 'function')
  ? (pairs) => Object.fromEntries(pairs)
  : (pairs) => {
    const ret = {}
    for (const p of pairs) {
      ret[p[0]] = p[1]
    }
    return ret
  }
}}
File
  = BOM? preamble:Pairs sections:Section* {
      return [[null, preamble], ...sections];
    }

BOM = "\ufeff"

Section
  = name:Header pairs:Pairs { return [name, pairs]; }

Header
  = _ "[" glob:$Glob* "]" TrailingComment? EOL {
    // minimatch wants an extra set of backslashes for `\\` in the input file.
    return glob.replace(/\\\\/g, '\\\\\\\\')
  }

// Cheating, to avoid parsing glob edge cases
Glob
  = !("]" TrailingComment? NL) .

Pairs
  = lines:(Pair / BlankOrComment)* {
      return toObject(lines.filter(lin => lin));
    }

Pair
  = _ @Key _ "=" _ @Value TrailingComment? EOL

Key
  = $[^ =\t\[\r\n]+ // "[" here to short-circuit sections earlier

// Needs to handle `foo = bar; baz` => { foo: 'bar; baz' }
Value
  = $(!(TrailingComment EOL) .)*

TrailingComment
  = __ Comment
  / _

BlankOrComment
  = (NL / __ EOL / _ Comment EOL) { return undefined }

Comment
  = [#;] NotEOL*

NotEOL
  = !NL .

NL
  = "\r"? "\n"

EOL
  = NL
  / EOF

EOF
  = !.
_
  = [ \t]*

__
  = [ \t]+

