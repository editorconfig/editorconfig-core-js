'use strict'

module.exports = {
  "root": true,
  "env": {
    "node": true
  },
  "ignorePatterns": [
    "lib/",
    "node_modules/",
  ],
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "tsconfig.json",
    "sourceType": "module"
  },
  "plugins": [
    "eslint-plugin-jsdoc",
    "@typescript-eslint",
  ],
  "rules": {
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/array-type": ["error", { "default": "array" }],
    "@typescript-eslint/ban-ts-comment": ["error", "allow-with-description"],
    "@typescript-eslint/ban-types": ["error", {
      "types": {
        "Object": {
          "message": "Avoid using the `Object` type. Did you mean `object`?"
        },
        "Function": {
          "message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
        },
        "Boolean": {
          "message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
        },
        "Number": {
          "message": "Avoid using the `Number` type. Did you mean `number`?"
        },
        "String": {
          "message": "Avoid using the `String` type. Did you mean `string`?"
        },
        "Symbol": {
          "message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
        }
      }
    }],
    "@typescript-eslint/consistent-type-assertions": "error",
    "@typescript-eslint/dot-notation": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/indent": ["error", 2, {
      "CallExpression": {
        "arguments": "first"
      },
      "FunctionDeclaration": {
        "parameters": "first"
      },
      "FunctionExpression": {
        "parameters": "first"
      }
    }],
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
        "delimiter": "none",
        "requireLast": true
      },
      "singleline": {
        "delimiter": "semi",
        "requireLast": false
      }
    }],
    "@typescript-eslint/member-ordering": "error",
    "@typescript-eslint/naming-convention": "error",
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/no-empty-interface": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-namespace": "error",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-shadow": ["error", { "hoist": "all"}],
    "@typescript-eslint/no-unused-expressions": "error",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/prefer-namespace-keyword": "error",
    "@typescript-eslint/quotes": ["error", "single"],
    "@typescript-eslint/semi": ["error", "never"],
    "@typescript-eslint/triple-slash-reference": ["error", {
      "path": "always",
      "types": "prefer-import",
      "lib": "always"
    }],
    "@typescript-eslint/type-annotation-spacing": "error",
    "@typescript-eslint/typedef": ["error", {
      "parameter": true,
      "propertyDeclaration": true
    }],
    "@typescript-eslint/unified-signatures": "error",
    "brace-style": ["error", "1tbs"],
    "comma-dangle": ["error", {
      "objects": "always-multiline",
      "arrays": "always-multiline",
      "functions": "never",
    }],
    "complexity": "off",
    "constructor-super": "error",
    "curly": "error",
    "default-case": "error",
    "dot-notation": "off",
    "eol-last": "off",
    "eqeqeq": ["error", "smart"],
    "guard-for-in": "error",
    "id-denylist": [
      "error",
      "any",
      "Number",
      "number",
      "String",
      "string",
      "Boolean",
      "boolean",
      "Undefined",
      "undefined"
    ],
    "id-match": "error",
    "indent": "off",
    "jsdoc/check-alignment": "error",
    "jsdoc/check-indentation": "error",
    "jsdoc/newline-after-description": "error",
    "max-classes-per-file": ["error", 1],
    "max-len": ["error", {
      "code": 80,
      "ignoreStrings": true,
      "ignoreUrls": true,
      "ignoreTemplateLiterals": true,
      "ignoreRegExpLiterals": true,
    }],
    "new-parens": "error",
    "no-bitwise": "error",
    "no-caller": "error",
    "no-cond-assign": "error",
    "no-console": ["error", {
      "allow": [
        "warn",
        "dir",
        "timeLog",
        "assert",
        "clear",
        "count",
        "countReset",
        "group",
        "groupEnd",
        "table",
        "dirxml",
        "groupCollapsed",
        "Console",
        "profile",
        "profileEnd",
        "timeStamp",
        "context"
      ]
    }],
    "no-debugger": "error",
    "no-empty": [
      "error",
      {
        "allowEmptyCatch": true
      }
    ],
    "no-empty-function": "off",
    "no-eval": "error",
    "no-fallthrough": "error",
    "no-invalid-this": "off",
    "no-multiple-empty-lines": "error",
    "no-new-wrappers": "error",
    "no-redeclare": "error",
    "no-shadow": "off",
    "no-throw-literal": "error",
    "no-trailing-spaces": "off",
    "no-undef-init": "error",
    "no-underscore-dangle": "off",
    "no-unsafe-finally": "error",
    "no-unused-expressions": "off",
    "no-unused-labels": "error",
    "no-use-before-define": "off",
    "no-var": "error",
    "object-shorthand": "error",
    "one-var": [
      "error",
      "never"
    ],
    "prefer-const": "error",
    "quotes": "off",
    "radix": "error",
    "semi": "off",
    "spaced-comment": [
      "error",
      "always",
      {
        "markers": [
          "/"
        ]
      }
    ],
    "use-isnan": "error",
    "valid-typeof": "off",
  }
}
