import tsLint from 'typescript-eslint';
import globals from 'globals';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

export default tsLint.config({
  extends: [js.configs.recommended, ...tsLint.configs.recommended],
  files: ['**/*.{js,jsx,ts,tsx}'],
  rules: {
    'no-console': 'warn',
    'prettier/prettier': 'error',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
  languageOptions: {
    parser: tsLint.parser,
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  plugins: {
    'simple-import-sort': simpleImportSort,
    prettier,
  },
});
