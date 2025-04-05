import prettierPlugin from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly'
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      // reglas básicas
      indent: ['error', 2],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],

      // 👇 activa Prettier como regla de ESLint
      'prettier/prettier': 'error'
    }
  }
];
