// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  { rules: { 'no-console': 'error' } },
  {
    ignores: [
      'build',
      'coverage',
      'dist',
      'docs',
      'examples/client/public',
      'node_modules',
    ],
  },
);
