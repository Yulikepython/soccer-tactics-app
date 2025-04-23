module.exports = {
  // テスト環境の設定
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // モジュール解決
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // 変換設定
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@jest/globals)/)"
  ],

  // テストファイルのパターン
  testMatch: [
    "<rootDir>/src/tests/**/*.test.js"
  ],

  // カバレッジレポートの設定
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.js',
    '!**/node_modules/**'
  ],

  // JSDOM環境オプション
  testEnvironmentOptions: {
    url: 'http://localhost/',
    pretendToBeVisual: true
  },

  // その他設定
  verbose: true,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false
};