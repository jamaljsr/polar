/* eslint-disable @typescript-eslint/no-var-requires */
module.exports = function () {
  var pkg = require('./package.json');
  var path = require('path');
  process.env.BABEL_ENV = 'test';
  process.env.NODE_ENV = 'test';
  process.env.DEBUG_PRINT_LIMIT = 50000;
  process.env.NODE_PATH +=
    path.delimiter +
    path.join(__dirname, 'node_modules') +
    path.delimiter +
    path.join(__dirname, 'node_modules/react-scripts/node_modules');
  require('module').Module._initPaths();

  return {
    files: [
      { pattern: 'src/setupTests.ts', instrument: false },
      'src/**/*.+(ts|tsx|jsx|json|snap|css|less|sass|scss|jpg|jpeg|gif|png|svg)',
      '!src/**/*.spec.ts?(x)',
    ],

    tests: ['src/**/*.spec.ts?(x)'],

    filesWithNoCoverageCalculated: pkg.jest.collectCoverageFrom
      .filter(f => f.startsWith('!<rootDir>/'))
      .map(f => f.replace('!<rootDir>/', '')),

    hints: {
      ignoreCoverageForFile: /istanbul ignore file/,
    },

    env: {
      type: 'node',
    },

    preprocessors: {
      '**/*.js?(x)': file =>
        require('@babel/core').transform(file.content, {
          sourceMap: true,
          compact: false,
          filename: file.path,
          presets: [require('babel-preset-jest'), 'react-app'],
        }),
    },

    setup: wallaby => {
      const jestConfig = require('react-scripts/scripts/utils/createJestConfig')(p =>
        require.resolve('react-scripts/' + p),
      );
      delete jestConfig.testRunner;
      delete jestConfig.testEnvironment;

      jestConfig.rootDir = wallaby.localProjectDir;
      jestConfig.modulePaths.push('<rootDir>/src/');
      jestConfig.setupFilesAfterEnv = [wallaby.localProjectDir + 'src/setupTests.js'];

      wallaby.testFramework.configure(jestConfig);
    },

    testFramework: 'jest',
  };
};
