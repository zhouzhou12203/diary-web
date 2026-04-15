module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules'],
  env: {
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
    {
      files: ['src/**/*.{ts,tsx}'],
      env: {
        browser: true,
      },
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      files: ['functions/**/*.ts', 'vite.config.ts'],
      env: {
        node: true,
      },
    },
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
};
