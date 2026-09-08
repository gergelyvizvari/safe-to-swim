import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
  },
  {
    files: ['scripts/**/*.mjs', 'server/**/*.js', 'api/**/*.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
  { ...reactHooks.configs.flat['recommended-latest'], files: ['**/*.{js,jsx}'] },
  { ...reactRefresh.configs.vite, files: ['**/*.{js,jsx}'] },
]
