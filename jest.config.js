module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20
    }
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ]
};
