/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/unit/**/*.test.ts',
    '**/integration/**/*.test.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  // Cocos Creator 模块路径映射——测试时 mock cc 模块
  moduleNameMapper: {
    '^cc$': '<rootDir>/tests/__mocks__/cc.mock.ts',
    '^cc/(.*)$': '<rootDir>/tests/__mocks__/cc.mock.ts',
  },
};
