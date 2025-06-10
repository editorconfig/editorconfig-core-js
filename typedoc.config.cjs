'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: [
    'src/index.ts',
  ],
  out: 'docs',
  cleanOutputDir: true,
  sidebarLinks: {
    'EditorConfig Home': 'https://editorconfig.org/',
    'GitHub': 'https://github.com/editorconfig/editorconfig-core-js',
    'Spec': 'https://spec.editorconfig.org/',
    'Documentation': 'http://editorconfig.github.io/editorconfig-core-js/',
  },
  navigation: {
    includeCategories: false,
    includeGroups: false,
  },
  categorizeByGroup: false,
  sort: ['static-first', 'alphabetical'],
  exclude: ['tests/*'],
};
