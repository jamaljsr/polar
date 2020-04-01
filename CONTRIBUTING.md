## Building Polar from Source

This guide will walk you through setting up your local computer to be able to compile and package Polar from the source code. Towards the end, there are steps to follow if you wish to open a PR to fix a bug or add a new feature. You will also find some productivity tips to improve the developer experience when making changes to the code.

### Overview

Polar is a desktop application with its code written with web technologies (HTML5, CSS3, Javascript) at the lowest level. At a higher level, we use [Typescript](https://github.com/microsoft/TypeScript), [ReactJS](https://github.com/facebook/react/), [Redux](https://redux.js.org/) via [easy-peasy](https://github.com/ctrlplusb/easy-peasy), and CSS-in-JS via [Emotion](https://emotion.sh/). The web app is hosted in a desktop shell powered by the [Electron](https://www.electronjs.org/) cross-platform application framework.

### Pre-requisites

There is some software that is required to compile and run Polar locally. You'll need to visit the websites to find installation instructions for your operating system.

- [git](https://git-scm.com): version control system needed to download the source code
- [NodeJS](https://nodejs.org): cross-platform javascript runtime
- [Yarn](https://classic.yarnpkg.com/en/docs/install): package manager for Node dependencies
- Docker and Docker Compose: OS virtualization platform
  - Mac and Windows: you can just install [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux: you need to install [Docker Server](https://docs.docker.com/install/#server) and [Docker Compose](https://docs.docker.com/compose/install/) separately

Once you have all of the required software installed, you can proceed to setup your local environment

### One-time Environment Setup

These steps only need to be performed one time on your machine

Clone the git repo

```sh
$ git clone https://github.com/jamaljsr/polar.git
$ cd polar
```

Install package dependencies

```sh
$ yarn
```

### Running in development mode

When you run Polar in development mode, you will have access to the Chrome DevTools. This allows you to see the console logs, React components, Redux actions & state.

```sh
$ yarn dev
```

Note: press CTRL+C in the terminal to kill the app

### Packaging the production binary

To run Polar in production mode, you will need to create a distributable binary. This will create an executable file in the `dist/` dir. You can copy it to your desktop and simply double-click on it whenever you want to launch the app.

```sh
$ yarn package
```

Note: It will only create an executable for the current operating system. So if you are running this on a Mac, it will create a Mac compatible binary.

### Updating from GitHub

If some time has passed since you cloned the Github repo and there are updates pushed to GitHub, you should pull those changes into your local copy of the source code. You must also update any new dependencies. After pulling the latest updates, you can use the commands above to run in dev mode or package a new binary to use.

```sh
$ git pull
$ yarn
```

## Contributing to Polar

So you'd like to contribute some help make Polar better, here's how...

### Editor Configuration

To modify the source code, you'll need a good code editor. [Visual Studio Code](https://code.visualstudio.com/) is a great cross-platform editor that has a lot of plugins and built-in tooling to make writing code much more productive. Here are some VS Code extensions that are useful to work on Polar:

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [TSLint](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-tslint-plugin)
- [TypeScript Import Sorter](https://marketplace.visualstudio.com/items?itemName=mike-co.import-sorter)
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)
- [Jest Snippets](https://marketplace.visualstudio.com/items?itemName=andys8.jest-snippets)
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)

### Development Workflow

If you would like to fix a bug or implement a new feature, here are the recommended steps you should follow to open a PR to the Polar repo:

1. On GitHub, create your own fork of the polar repo ([docs](https://help.github.com/en/github/getting-started-with-github/fork-a-repo))
1. Clone your repo locally on your computer
   ```sh
   $ git clone <your-repo-url>
   ```
1. Create a branch for your changes. It it better to work out of a branch other than master if you are going to have multiple PR's open at the same time
   ```sh
   $ git checkout -b fix-typo
   ```
1. Run Polar in development mode
   ```sh
   $ yarn dev
   ```
1. Make the changes to the source code. Most changes will automatically update in the app via React/Redux hot-reload.
1. Before committing your changes, be sure to lint your code
   ```
   $ yarn lint:all
   ```
1. Also run the unit tests to make sure they all pass and test coverage is satisfactory
   ```
   $ yarn test:ci
   ```
1. When you are ready to commit your changes to git, use a commit message that follows the [Conventional Commits Specifications](https://www.conventionalcommits.org/). You can do this in one of two ways:
   - Manually
     ```sh
     $ git add .
     $ git commit -m "fix(home): fixed typo on the home screen"
     ```
   - With Guidance. You will be prompted to answer some questions which will generate a valid commit message
     ```
     $ yarn cm
     ? Select the type of change that you are committing: (Use arrow keys)
      feat:        A new feature
      fix:         A bug fix
      improvement: An improvement to a current feature
      docs:        Documentation only changes
      style:       Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
      refactor:    A code change that neither fixes a bug nor adds a feature
      perf:        A code change that improves performance
      refactor:    A code change that neither fixes a bug nor adds a feature
      perf:        A code change that improves performance
      test:        Adding missing tests or correcting existing tests
      build:       Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
      ci:          Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
      chore:       Other changes that do not modify src or test files
      revert:      Reverts a previous commit
     ? What is the scope of this change (e.g. component or file name): (press enter to skip) home
     ? Write a short, imperative tense description of the change (max 61 chars):
      fixed typo on home screen
     ? Provide a longer description of the change: (press enter to skip)
     ? Are there any breaking changes? No
     ? Does this change affect any open issues? No
     ```
1. Push your changes back to your forked repo
   ```
   $ git push
   ```
1. Open a pull request on GitHub ([docs](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork))
