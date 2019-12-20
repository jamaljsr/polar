# Polar

> One-click Bitcoin Lightning networks for local app development & testing

[![Actions Status](https://github.com/jamaljsr/polar/workflows/CI/badge.svg)](https://github.com/jamaljsr/polar/actions)
[![codecov](https://codecov.io/gh/jamaljsr/polar/branch/master/graph/badge.svg)](https://codecov.io/gh/jamaljsr/polar)
[![Crowdin](https://badges.crowdin.net/polar/localized.svg)](https://crowdin.com/project/polar)

<p align="center">
  <img src="./assets/screen.png" />
  <a href="https://youtu.be/HInI_G3oYpc" target="_blank">
    View a short video demo
  </a>
</p>

## Purpose

Polar was built to help Lightning Network application developers quickly spin up one or more networks locally on their computers.

With Polar you can:

- Create a regtest Lightning Network in just a few clicks
- Connect from your app to the lightning nodes via RPC
- Launch a terminal in each bitcoin/lightning node
- Add more nodes using drag & drop
- Open & Close Channels
- Manually mine new blocks
- Deposit regtest coins into each Lightning node

Supported Network Nodes:

- LND v0.8.0 & v0.7.1
- Bitcoin Core v0.18.1
- c-lightning (coming soon)
- eclair (coming soon)

## Dependencies

Polar requires that you have Docker installed to create the local networks

- On Mac & Windows, you can just install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- On Linux, you need to install [Docker Server](https://docs.docker.com/install/#server) and [Docker Compose](https://docs.docker.com/compose/install/) separately

## Download

The most current Polar downloads for Mac, Windows & Linux can be found in the [GitHub releases](https://github.com/jamaljsr/polar/releases)

## Polar's Future

The overall goal of Polar is to minimize the time & effort needed for a developer new to Lightning to get started building their next killer app. In addition, Polar aims to be a useful tool for experienced Lightning App developers to iterate faster on their projects. Less time setting up nodes, more time building your app.

Here's a short list of ideas for features that may be beneficial to add in future releases (in no particular order):

- Network snapshots with the ability to import/export them. These could also be used as templates to quickly boot up a network with predefined nodes and channels. The templates could be hosted github to allow community contributions. This may require a scripting system built-in.
- Sample app projects/code in different languages (Python, Typescript/JS, Go, C#) showing how to connect to the Lightning/Bitcoin nodes from an external app.
- Bitcoin Block Explorer & GRPC/REST API Explorers to have access to all of the node RPC API's graphically, without needing to fallback to the Terminal.
- A branded website with download links and getting started guides to make Polar a bit easier to find via search engines

## Help Translate

Polar's translations are managed on [Crowdin](https://crowdin.com/project/polar). The initial translations of 10 languages were done by machine (Google Translate) and are likely to not be 100% accurate. If you speak multiple languages and wish to help with translations, please feel free to head over to the [project page](https://crowdin.com/project/polar) on Crowdin and submit updated strings. This assistance would be greatly appreciated.

## Development

### Commands

| Command         | Description                                                       |
| --------------- | ----------------------------------------------------------------- |
| `yarn`          | install dependencies                                              |
| `yarn dev`      | run the app with react hot reloading and electron live restarting |
| `yarn test`     | run unit tests in watch mode                                      |
| `yarn test:e2e` | run e2e tests                                                     |
| `yarn lint:all` | run typescript and eslint syntax checking                         |
| `yarn langs`    | extract i18n language keys from code                              |
| `yarn package`  | package the app for your OS                                       |

### Tips

- install the [import-sorter](https://github.com/SoominHan/import-sorter) Visual Studio Code extension for automatic import statement sorting

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
- [Github Actions](https://github.com/actions): automate builds and testing on Windows/Mac/Linux
- [Renevate Bot](https://github.com/renovatebot/renovate): automate dependency upgrades via GitHub bot
- [Jest](https://github.com/facebook/jest): delightful JavaScript testing
- [React Testing Library](https://github.com/testing-library/react-testing-library): React specific testing utilities
- [CodeCov](https://codecov.io/): maintain quality of unit tests
- [Testcafe](https://github.com/DevExpress/testcafe): End-to-end is important
- [commitlint](https://github.com/conventional-changelog/commitlint): standardize git commit messages
- [standard-version](https://github.com/conventional-changelog/commitlint): automate release versioning and changelog generation

## Recognition

Huge thanks to maintainers of [Lightning Joule](https://github.com/joule-labs/joule-extension), [Zap Wallet](https://github.com/LN-Zap/zap-desktop), [LND](https://github.com/lightningnetwork/lnd), [Bitcoin Core](https://github.com/bitcoin/bitcoin), along with many others for the amazing apps & libraries that gave this project inspiration, ideas & sometimes even a little code 😊.

## Contact

I plan to setup a website and email soon. The best place to reach me now is on Twitter @jamaljsr. I also lurk in the LND Slack server, so you can msg me there as well.
