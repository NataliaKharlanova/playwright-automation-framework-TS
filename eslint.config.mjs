import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/', 'src/types/generated/'],
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
        },
        rules: {
            // Un-awaited Playwright calls (expect, request, page actions) are the most common silent bug
            '@typescript-eslint/no-floating-promises': 'error',
        },
    },
    {
        // Plain JS run by Node: the ESLint config itself and Claude Code hooks
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        languageOptions: { globals: globals.node },
    },
    {
        files: ['tests/**/*.ts', '**/*.spec.ts'],
        ...playwright.configs['flat/recommended'],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            // Conventions from CLAUDE.md
            'playwright/no-wait-for-timeout': 'error',
            'playwright/no-force-option': 'error',
            'playwright/prefer-web-first-assertions': 'error',
        },
    },
);
