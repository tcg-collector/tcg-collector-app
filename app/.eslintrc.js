module.exports = {
  root: true,
  extends: ['expo', 'eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
  rules: {
    // React 17+ JSX transform — não precisa importar React
    'react/react-in-jsx-scope': 'off',
    // Variáveis não usadas: apenas @typescript-eslint controla, desliga a base
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // console é comum em RN
    'no-console': 'warn',
    // catch vazio é intencional em alguns casos
    'no-empty': ['error', { allowEmptyCatch: true }],
    // react-hooks como warning para não bloquear CI
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '.expo/'],
};
