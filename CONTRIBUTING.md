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

You can install the software directly on your machine or use automated devcontainers with docker, as explained in [Docker Approach](#docker-approach) section of this document.

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

### Docker approach

The development environment for Polar can be setup with docker. First, we
describe manual setup. There are two docker devcontainer images:

- headless: allows installing packages, linting code, running tests, and
  compiling Polar.
- ui: allows running graphical interface besides the same functionalities as the
  headless.

You can pull the images from DockerHub registry:

```
docker image pull polarlightning/dev:headless
docker image pull polarlightning/dev:ui
```

Alternatively, you can build them locally. To build the headless image, run:

```sh
cd .devcontainer/
docker image build --tag polardev:headless --file Dockerfile-headless .
```

The UI image works only on Linux with x11 as the display backend. You may want
to build it locally to pass correct value to `DOCKER_GID` argument. To build it,
first build the headless image, then run:

```sh
cd .devcontainer/
docker_gid_host=$(getent group docker | awk -F: '{print $3}')
docker image build --build-arg="DOCKER_GID=${docker_gid_host}" --tag polardev:ui .
```

The `docker_gid_host` gets the GID of the docker group in the host machine,
which is added to the non-root user in the container in build time. This is
required if we want to use the Polar UI during development, which needs to
connect to Docker (more on that later). This GID is not fixed but varies accross
OS: 996 on ArchLinux, 969 on Debian, 999 on Ubuntu.

If you want to use the UI, run the following command to enable forwarding
graphical applications from the container to the host:

```sh
xhost +local:docker
```

To start a headless container, run:

```sh
cd polar/
docker container run \
	--volume "$PWD":/app \
	--name polar \
	--detach \
  --rm \
	polardev:headless \
	sleep infinity
```

To start a UI container, run:

```sh
cd polar/
docker container run \
	--volume "$PWD":/app \
	--volume /tmp/.X11-unix:/tmp/.X11-unix \
	--volume /var/run/docker.sock:/var/run/docker.sock \
	--volume "${HOME}/.config/polar":/home/dev/.config/polar \
	--volume "${HOME}/.polar":/home/dev/.polar \
	--env "DISPLAY=${DISPLAY}" \
	--name polar \
	--detach \
  --rm \
	polardev:ui \
	sleep infinity
```

The above command runs a container in detached mode, putting it to sleep forever.
The sleep command does not consume CPU or RAM, so the container is kept alive and
we can execute commands in it.

Let's see an explanation of the volumes:

- `--volume "$PWD":/app` mounts the Polar application on the container.
- `--volume /tmp/.X11-unix:/tmp/.X11-unix` allows X11 graphical applications to
  be forward from the container to the host.
- `--volume /var/run/docker.sock:/var/run/docker.sock` allows Docker-In-Docker,
  which is required for the Polar UI to work (it needs to access Docker).
- `--volume "${HOME}/.config/polar":/home/dev/.config/polar` enables persistent
  configuration storage for the GUI app during development.
- `--volume "${HOME}/.polar":/home/dev/.polar` enables persists data storage for
  the GUI app during development.

Now that the container is running, we can run some commands:

Install the packages:

```sh
docker container exec polar yarn package
```

Notice that the first argument after `exec` is the container name (`polar` in our case).

Run linter:

```sh
docker container exec polar yarn lint
```

Run tests:

```sh
docker container exec polar yarn test
```

Build the app for the current platform (the container platform is Linux):

```sh
docker container exec polar yarn package
```

Start a graphical UI for development (for `polardev:ui`), which reflects
changes in real-time:

```sh
docker container exec polar yarn dev
```

The last example requires locally changing the `dev:electron` script in
`package.json` and add the `--no-sanbox` to the electron command:

```
"dev:electron": "wait-on http://localhost:3000 && nodemon -I --watch ./electron/ --watch ./src/shared/ --ext ts --exec electron --no-sandbox ./public/dev.js",
```

This is because it is not possible to run chrome sandbox if the container is
unprivileged. It is better to run a non-sandboxed electron app in a unprivileged
docker container than to run a sandboxed electron app in a privileged docker
container (which would be granted sysadmin rights).

### Using Vscode devcontainers

Install Vscode devcontainers extension and run
`Dev Containers: Open Folder in Container...` from the command palette. This
will open the folder in the container and allow running headless commands.

If you also want to run the UI using devcontainers, then go back to the manual
approach, start the container as instructed in order to map the proper volumes
and allow X11 forwarding of graphical applications. Then, run
`Dev Containers: Attach to Running Container...` from the command palette and
select the already running container. This will open Vscode on the existing
container with UI support. You can then run `yarn dev` to launch the UI.

## Contributing to Polar

So you'd like to contribute some help to make Polar better, here's how...

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
1. Create a branch for your changes. It is better to work out of a branch other than master if you are going to have multiple PR's open at the same time
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
