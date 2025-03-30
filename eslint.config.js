import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import stylisticPlugin from '@stylistic/eslint-plugin';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    // TS only
    {
        files: [ '**/*.ts' ],
        rules: {
            '@typescript-eslint/no-unused-vars': [ 'off' ],
            '@typescript-eslint/no-explicit-any': [ 'off' ],
            '@typescript-eslint/no-this-alias': [ 'off' ],
            '@typescript-eslint/ban-ts-comment': [ 'off' ],
            '@typescript-eslint/consistent-type-imports': [ 'error', {
                prefer: 'type-imports',
                fixStyle: 'separate-type-imports',
            } ],
            '@typescript-eslint/explicit-function-return-type': [ 'error', {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
            } ],
        },
        plugins: {
            import: importPlugin,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    // Global rules
    {
        files: [ '**/*.js', '**/*.ts' ],
        rules: {
            // style
            indent: [ 'error', 4, {
                ArrayExpression: 1,
                ObjectExpression: 1,
                SwitchCase: 1,
                CallExpression: { arguments: 1 },
                ignoredNodes: [ ':first-child', ':last-child' ], // semicolon in newline (Intelij IDE issue)
            } ],
            quotes: [ 'error', 'single' ],
            'quote-props': [ 'error', 'as-needed' ],
            'array-element-newline': [ 'error', 'consistent' ],
            'array-bracket-newline': [ 'error', 'consistent' ],
            
            // stylistic
            '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
            
            // clean console
            'no-console': [ 'error', {
                allow: [ 'warn', 'error' ],
            } ],
            
            // only use no-duplicates (merge imports)
            'import/no-duplicates': [ 'error' ],
        },
        plugins: {
            import: importPlugin,
            '@stylistic': stylisticPlugin,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    // Source files
    {
        files: [ 'src/**' ],
        rules: {
            'no-console': [ 'error' ],
            'no-debugger': [ 'error' ],
        },
    },
    // Test files
    {
        files: [ 'tests/**' ],
        rules: {
            '@typescript-eslint/no-unused-expressions': [ 'off' ],
        },
    },
    // Ignored files
    {
        ignores: [
            'tests/**',
        ],
    },
);
