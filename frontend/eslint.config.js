import js from '@eslint/js';
import globals from 'globals';
import next from 'eslint-config-next';
import tailwindcssPlugin from 'eslint-plugin-tailwindcss';

// `next lint` was removed in Next.js 16 — ESLint runs directly via
// `npm run lint` (eslint .). The eslint-config-next flat preset covers
// js/jsx/ts/tsx (react, react-hooks, import, jsx-a11y, @next/next rules and
// the TypeScript parser); this file restores the project's extra rules.
export default [
  {
    // .eslintrc.cjs is the pre-flat-config RC file; ESLint v9 never reads it, so
    // it is excluded from linting instead of being treated as application source.
    ignores: ['dist', 'node_modules', '.next', '.eslintrc.cjs'],
  },
  ...next,
  {
    // eslint-config-next@16 bundles eslint-plugin-react-hooks v7, whose
    // "recommended" preset enables the compiler-oriented rules
    // (set-state-in-effect, purity, preserve-manual-memoization, refs, ...).
    // This project's contract is eslint-plugin-react-hooks v5 "recommended"
    // (rules-of-hooks + exhaustive-deps); the new rules flag the established
    // fetch-on-mount pattern across the legacy portals, and adopting the
    // compiler ruleset is a separate repository-wide migration.
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    rules: {
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tailwindcssPlugin.configs.recommended.rules,
    },
  },
];
