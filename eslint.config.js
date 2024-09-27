import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: [ '**/*.ts', '**/*.tsx' ],
        rules: {
            '@typescript-eslint/no-unused-vars': [ 'off' ],
            '@typescript-eslint/no-explicit-any': [ 'off' ],
            '@typescript-eslint/no-this-alias': [ 'off' ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports'
                }
            ],
            '@typescript-eslint/no-unsafe-function-type': [ 'off' ],
            '@typescript-eslint/no-namespace': [ 'off' ],
            // only use no-duplicates (merge imports)
            'import/no-duplicates': [ 'error' ],
        },
        plugins: {
            import: importPlugin
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    {
        ignores: [
            'tests/**',
        ]
    }
);
