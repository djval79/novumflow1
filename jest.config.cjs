/** @type {import('jest').Config} */
const config = {
  // Stop running tests after the first failure
  bail: false,

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle module aliases (e.g., if you have them in your webpack config)
    // "^@/(.*)$": "<rootDir>/src/$1",
  },

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // The path to the Jest setup file
  // setupFiles: ['<rootDir>/jest.setup.js'],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  // setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-jsdom', // or 'node' if testing backend

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}"
  ],

  // An array of regexp pattern strings that are matched against all test paths before executing the test
  testPathIgnorePatterns: [
    "/node_modules/",
    "/mcp_tools/" // Ignore tests inside mcp_tools directory
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // An array of regexp pattern strings that are matched against all source file paths before transformation
  transformIgnorePatterns: [
    "/node_modules/(?!.*(mcp-server-supabase|mcp-server-playwright)).+\\.js$" // Example: transform specific ESM modules if needed
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};

module.exports = config;
