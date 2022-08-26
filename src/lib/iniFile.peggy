File
  = BOM? preamble:Pairs sections:Section* {
      return [[null, preamble], ...sections];
    }

BOM = "\ufeff"

Section
  = name:Header pairs:Pairs { return [name, pairs]; }

Header
  = _ "[" @$Glob* "]" TrailingComment? EOL

// Cheating, to avoid parsing glob edge cases
Glob
  = !("]" TrailingComment? NL) .

Pairs
  = lines:(Pair / BlankOrComment)* {
      return Object.fromEntries(lines.filter(lin => lin));
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

