import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1. Global Setup
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  // 2. Base Recommended Rules
  pluginJs.configs.recommended,

  // 3. Custom Logic & Refinement
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // --- Structural & Cleanliness ---
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignore unused vars starting with _
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-console': 'warn', // Discourages console.log in favor of the Pino Logger
      'no-use-before-define': [
        'error',
        {
          functions: false, // Usually okay to call functions before definition in JS
          variables: true, // NOT okay for const/let variables
          classes: true,
        },
      ],

      // --- Auto-Sorting Headers ---
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // --- Security & Best Practices ---
      'no-var': 'error',
      eqeqeq: ['error', 'always'], // Forces === instead of ==
      'no-process-exit': 'off',
    },
  },

  // 4. Prettier (Must be LAST to override everything else)
  eslintConfigPrettier,
];
