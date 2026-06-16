module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/*.test.ts'],
  // Testes de integração requerem mongodb-memory-server instalado.
  // Rodar localmente com: npm run test:integration
  // No CI roda apenas os unitários (npm test).
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.test\\.ts$',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: ['src/**/*.ts', '!src/scripts/**', '!src/index.ts'],
  coverageDirectory: 'coverage',
};
