module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        ...require('./tsconfig.json').compilerOptions,
        module: 'commonjs',
      },
      isolatedModules: true
    }],
    '^.+\\.m?[tj]sx?$': ['ts-jest', {
      tsconfig: {
        ...require('./tsconfig.json').compilerOptions,
        module: 'commonjs',
      },
      isolatedModules: true
    }]
  },

  transformIgnorePatterns: [
    'node_modules/(?!(langchain|@langchain|@vis.gl|d3|d3-.*|uuid)/)'
  ],

  // Global setup
  // setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Test patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Coverage settings
  collectCoverageFrom: [
    'src/core/services/**/*.ts',
    'src/core/converter.models.ts',
    '!src/core/**/__tests__/**',
    '!src/core/**/*.test.ts',
    '!src/core/**/*.spec.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },

  coverageReporters: ['text', 'lcov', 'html'],
};
