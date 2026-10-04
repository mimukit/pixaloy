import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '.output/**',
    '.wxt/**',
    'node_modules/**',
    'test-results/**',
    'playwright-report/**',
    'coverage/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    // The style engine stays a plain TypeScript module with no UI framework (AGENTS.md).
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*', 'zustand', 'zustand/*'],
              message: 'The style engine must not import a UI framework.',
            },
            {
              group: [
                '@/ui',
                '@/ui/*',
                '~/ui',
                '~/ui/*',
                '@/inspector',
                '@/inspector/*',
                '~/inspector',
                '~/inspector/*',
                '**/ui',
                '**/ui/*',
                '**/inspector',
                '**/inspector/*',
              ],
              message: 'The style engine must not import the UI or the inspector.',
            },
          ],
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
);
