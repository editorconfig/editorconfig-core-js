import base from '@cto.af/eslint-config';
import ts from '@cto.af/eslint-config/ts.js';

export default [
  {
    ignores: [
      'lib/**',
      '**/*.d.ts',
    ],
  },
  ...base,
  ...ts,
  {
    files: [
      'src/index.ts',
    ],
    rules: {
      // We are extra-careful with some inputs.
      '@typescript-eslint/no-unnecessary-type-conversion': 'off',
    },
  },
];
