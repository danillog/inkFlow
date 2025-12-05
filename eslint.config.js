import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: ['dist', 'dev-dist'], // Move ignores to a top-level property
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended, // Spread recommended configs
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      '@typescript-eslint': tseslint.plugin, // Explicitly add the plugin
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser, // Specify parser
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json'], // Specify tsconfig for type-aware linting
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Add custom rules or override recommended ones here if needed
      // Example:
      // '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
