# Lightning Ditto

> One-click Bitcoin Lightning networks for local app development & testing

[![Build Status](https://travis-ci.org/jamaljsr/ditto.svg?branch=master)](https://travis-ci.org/jamaljsr/ditto)
[![Build status](https://ci.appveyor.com/api/projects/status/l5637xbes42316k6?svg=true)](https://ci.appveyor.com/project/jamaljsr/ditto)
[![codecov](https://codecov.io/gh/jamaljsr/ditto/branch/master/graph/badge.svg)](https://codecov.io/gh/jamaljsr/ditto)

## Development

### Dependencies

Ditto requires that you have Docker installed to create the local networks

- On Mac & Windows, you can just install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- On Linux, you need to install [Docker Server](https://docs.docker.com/install/#server) and [Docker Compose](https://docs.docker.com/compose/install/) separately

### Run the app

`yarn && yarn dev`

### Run Unit Tests

`yarn test`

### Run End-to-end Tests

`yarn test:e2e`

### Run Typescript & Linter

`yarn lint:all`

### Package App for your OS

`yarn package`

### Tech Stack

- [Electron](https://github.com/electron/electron/): cross platform desktop app framework
- [Typescript](https://github.com/microsoft/TypeScript): increased productivity with a typed language
- [ReactJS](https://github.com/facebook/react/): declarative UI library for JavaScript
- [Create React App](https://github.com/facebook/create-react-app): minimize build configuration
- [easy-peasy](https://github.com/ctrlplusb/easy-peasy): Redux state management without the boilerplate
- [Ant Design](https://github.com/ant-design/ant-design/): don't reinvent the wheel with UI design
- [react-i18next](https://github.com/i18next/react-i18next): support for multiple languages (english/spanish included)
- [electron-log](https://github.com/megahertz/electron-log): multi-level logging to console and file
- [Prettier](https://github.com/prettier/prettier): keep code format consistent
- [ESLint](https://github.com/eslint/eslint): follow code quality best practices
- [Travis](https://travis-ci.org): automate builds and testing on Mac/Linux
- [AppVeyor](https://appveyor.com): automate builds and testing on Windows
- [Renevate Bot](https://github.com/renovatebot/renovate): automate dependency upgrades via GitHub bot
- [Jest](https://github.com/facebook/jest): delightful JavaScript testing
- [React Testing Library](https://github.com/testing-library/react-testing-library): React specific testing utilities
- [CodeCov](https://codecov.io/): maintain quality of unit tests
- [Testcafe](https://github.com/DevExpress/testcafe): End-to-end is important
- [commitlint](https://github.com/conventional-changelog/commitlint): standardize git commit messages
- [standard-version](https://github.com/conventional-changelog/commitlint): automate release versioning and changelog generation
