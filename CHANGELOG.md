# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [v1.2.0](https://github.com/jamaljsr/polar/compare/v1.0.1...v1.2.0)

This is a minor release which adds a small set of improvements and fixes some bugs. All of the node implementations have been updated to their latest versions.

This release is required to run Bitcoin Core v0.21.0 nodes due to a small breaking change. The default wallet is no longer created automatically during `bitcoind` startup, so Polar must create the wallet once `bitcoind` comes online.

### Features

- **chart:** add zoom support to the designer ([#378](https://github.com/jamaljsr/polar/issues/378))
- **bitcoind:** expose Bitcoin Core P2P port ([#372](https://github.com/jamaljsr/polar/issues/372)) by [@lukechilds](https://github.com/lukechilds)
- **bitcoind:** expose REST interface by default ([#419](https://github.com/jamaljsr/polar/issues/419)) by [@valentinewallace](https://github.com/valentinewallace)
- **lnd:** add invoice macaroon to Connect tab ([#376](https://github.com/jamaljsr/polar/issues/376))
- **images:** add support for bitcoind v0.21.0 ([f59dd1b](https://github.com/jamaljsr/polar/commit/f59dd1be55a39fabac0cbfd9c287702295bb7729))
- **images:** add support for c-lightning v0.9.3 ([f3c3c0d](https://github.com/jamaljsr/polar/commit/f3c3c0dade8ea74deaab8f2bbafa94683c1284d9))
- **images:** add support for eclair v0.5.0 ([47af8c2](https://github.com/jamaljsr/polar/commit/47af8c2453796951028d4fd0380a7ed4ca794877))
- **images:** add support for LND v0.12.0-beta ([57fc766](https://github.com/jamaljsr/polar/commit/57fc766c92289e01f1dce199a278e89ea121a313))

### Bug Fixes

- **bitcoind:** create default wallet when starting bitcoind v0.21.0 ([548a138](https://github.com/jamaljsr/polar/commit/548a1383a10aeb703089efcfd602c1cf4e2eb0a1))
- **designer:** fix channels hiding when removing a node in a stopped network ([534892c](https://github.com/jamaljsr/polar/commit/534892cbbb59c369e09a61015fd9279487a42995))
- **designer:** add hover state for node ([#406](https://github.com/jamaljsr/polar/issues/406)) by [@murtyjones](https://github.com/murtyjones)
- **lnd:** correct REST url ([#407](https://github.com/jamaljsr/polar/issues/407)) by [@murtyjones](https://github.com/murtyjones)
- **lnd:** fixes clipboard copy value for p2pLnUrlInternal ([#381](https://github.com/jamaljsr/polar/issues/381)) by [@Jasonvdb](https://github.com/Jasonvdb)
- **networks:** fix error when deleting an imported network ([b53de1a](https://github.com/jamaljsr/polar/commit/b53de1afbf22908bf7734dc07b0e48963d45b878))
- **sidebar:** remove extra space between collapsed sidebar nodes ([17643aa](https://github.com/jamaljsr/polar/commit/17643aa6ac06d2a04f8d86476566cbb32f09dc7c))
- **chore:** update dead link in code comment ([#422](https://github.com/jamaljsr/polar/issues/422)) by [@murtyjones](https://github.com/murtyjones)

### Docs

- **eclair:** update custom nodes doc for eclair v0.5.0 ([#390](https://github.com/jamaljsr/polar/issues/390)) by [@halseth](https://github.com/halseth)

## [v1.0.1](https://github.com/jamaljsr/polar/compare/v1.0.0...v1.0.1)

This is a small patch release which fixes a compatibility issue to support Bitcoin Core v0.20.0. There was a breaking change in this version requiring the use of `-fallbackfee` in regtest environments.

### Features

- **images:** add support for bitcoind v0.20.0 ([a538ca0](https://github.com/jamaljsr/polar/commit/a538ca04ddcb523ac1bd1e3998e553a4c2bfd6ec))
- **images:** add support for LND v0.10.2-beta.rc2 ([be3a135](https://github.com/jamaljsr/polar/commit/be3a135efd0efbcf2928e1906440f53621ab05c3))
- **images:** add support for LND v0.10.1-beta ([20e1ed1](https://github.com/jamaljsr/polar/commit/20e1ed1e1d6f70b049a37022ded64f38cfe061e4))
- **images:** add support for LND v0.10.0 and c-lightning v0.8.2 ([6df87c8](https://github.com/jamaljsr/polar/commit/6df87c8d6458f62fb657391fce01877b80580b10))

### Bug Fixes

- **lnd:** add docker container name as tlsextradomain ([#355](https://github.com/jamaljsr/polar/issues/355))

### Docs

- fix small typos in CONTRIBUTING ([#331](https://github.com/jamaljsr/polar/issues/331) & [#332](https://github.com/jamaljsr/polar/issues/332)) by [@nickycutesc](https://github.com/nickycutesc)

## [v1.0.0](https://github.com/jamaljsr/polar/compare/v0.2.1...v1.0.0)

This release was focused on implementing many of the feature requests submitted since the first release, as well as adding support for the Eclair Lightning implementation. You can now use your own custom Docker image, allowing you to run the master branch or your personal fork of each node. Polar now supports importing and exporting networks, which allows you to save snapshots to reuse as a starting point over an over again. We also added a log viewer for nodes which should make it easier to see what your nodes are doing and added right-click menus for nodes & channels so you can perform actions with less clicks. To support more flexible environments, the Lightning P2P and Bitcoin ZMQ ports are now exposed to the host machine, which means you can have nodes outside of Polar communicate with the nodes inside.

I am bumping the version to a major release v1.0.0 to signify that I feel Polar is now pretty stable and fully-functional, with support for the big three Lightning implementations. There are still more improvements which will be added in the future, but what's included now is a solid base.

### Features

- Add support for Eclair v0.3.3 nodes ([#322](https://github.com/jamaljsr/polar/pull/322))
- Add ability to import & export networks ([#295](https://github.com/jamaljsr/polar/pull/295)) by [@torkelrogstad](https://github.com/torkelrogstad)
- Add support for custom docker images ([#299](https://github.com/jamaljsr/polar/pull/299))
- Make bitcoind's ZeroMQ servers reachable on LAN ([#297](https://github.com/jamaljsr/polar/pull/297)) by [@hsjoberg](https://github.com/hsjoberg)
- Make lightning nodes p2p port reachable on LAN ([#301](https://github.com/jamaljsr/polar/pull/301)) by [@hsjoberg](https://github.com/hsjoberg)
- Add right-click menus for nodes and channels ([#312](https://github.com/jamaljsr/polar/pull/312))
- Add ability to view live logs from nodes ([#316](https://github.com/jamaljsr/polar/pull/316))

### Bug Fixes

- Handle errors in Bitcoind logger ([#285](https://github.com/jamaljsr/polar/pull/285)) by [@bolatovumar](https://github.com/bolatovumar)
- Make sure localBalance is never undefined for pending channel ([#289](https://github.com/jamaljsr/polar/pull/289)) by [@bolatovumar](https://github.com/bolatovumar)
- Fix corrupt redux state causing errors ([#305](https://github.com/jamaljsr/polar/pull/305))
- Fix broken line wrapping for long commands in the terminal ([#310](https://github.com/jamaljsr/polar/pull/310))
- Fix typo in English translations ([#323](https://github.com/jamaljsr/polar/pull/323))

### Docs

- Add CONTRIBUTING documentation ([#294](https://github.com/jamaljsr/polar/pull/294))
- Add documentation for building custom node images ([custom-node.md](https://github.com/jamaljsr/polar/blob/master/docs/custom-nodes.md))

### Community Contributions

Polar received contributions from a few community members. I'd like to sincerely thank these devs for giving back to the project.

- Torkel Rogstad [@torkelrogstad](https://github.com/torkelrogstad)
- Hampus Sjöberg [@hsjoberg](https://github.com/hsjoberg)
- Umar Bolatov [@bolatovumar](https://github.com/bolatovumar)

All feedback and contributions are greatly appreciated.

## [v0.2.1](https://github.com/jamaljsr/polar/compare/v0.2.0...v0.2.1)

This is just a small release to bring back light mode for those who prefer it over dark mode.

### Features

- **ui:** add light/dark mode toggle ([#280](https://github.com/jamaljsr/polar/pull/280))

### Bug Fixes

- **ui:** lighten node background in dark mode ([2a5fde4](https://github.com/jamaljsr/polar/commit/2a5fde4925d4224c5e239bdfb8450391ab2e07b6))

### Docs

- fix spelling and add Polar version field to bug template ([#279](https://github.com/jamaljsr/polar/pull/279)) h/t [@bolatovumar](https://github.com/bolatovumar)

## [v0.2.0](https://github.com/jamaljsr/polar/compare/v0.1.0...v0.2.0)

This release was focused on adding core features that didn't make it in the first release, as well as some UX and stability improvements. The UI has been redesigned to use a dark theme which has been a popular request. Polar now supports the latest versions of LND v0.8.2, Bitcoin Core v0.19.0.1 and adds support for c-lightning v0.8.0. Future released versions of these Lightning & Bitcoin nodes can now be used without needing to release a new version of Polar. This feature will let you start using the new versions as soon as they are out. To maintain support for older LND versions which are not compatible with the latest bitcoind, Polar now supports running multiple bitcoin nodes in a single network. Have fun creating chain splits and block reorgs with the new ability to stop and start individual nodes as well :)

There are now 10 languages included (English, French, German, Spanish, Russian, Italian, Chinese Simplified, Portuguese-Brazilian, Japanese, Korean), though most are machine generated, so they need some love. Languages are now crowd-sourced via Crowdin. See the [Help Translate](https://github.com/jamaljsr/polar#help-translate) section of the README for more details.

In the next release, the focus will be on tackling some of the feature requests submitted since the initial launch. If you have any suggestions or use-cases you'd like to see improved with Polar, please don't hesitate to open an issue.

### Application Data Folder Moved

**Be sure to stop all your running networks and close Polar v0.1.0 before installing v0.2.0!**

When adding c-lighting v0.8.0, lightningd was unable to create the lightning-rpc socket file due to 'path too long' errors on Mac. Polar previously stored the data for nodes in `~/Library/Application Support/polar/data/networks/`. This has now been changed to `~/.polar` on all OS's. When you launch v0.2.0 for the first time, Polar will migrate your application data from the old folder location to the new location. This also means that the paths to certs & macaroons have changed. If you hard-coded them in your app, you'll need to update the paths.

Location in v0.1.0

- Mac: `~/Library/Application Support/polar/data/networks/`
- Linux: `~/config/polar/data/networks/`
- Windows: `~/AppData/Roaming/polar/data/networks/`

New location in v0.2.0

- All OS's: `~/.polar/networks/`

### Features

- **ui**: change ui design to use dark mode ([#271](https://github.com/jamaljsr/polar/pull/271))
- **network**: add support for c-lightning v0.8.0 with [c-lightning-REST](https://github.com/Ride-The-Lightning/c-lightning-REST) plugin ([#259](https://github.com/jamaljsr/polar/pull/259))
- **network**: add support for LND v0.8.2-beta ([#257](https://github.com/jamaljsr/polar/pull/257))
- **network**: add support for Bitcoin Core v0.19.0.1 ([#257](https://github.com/jamaljsr/polar/pull/257))
- **docker**: add ability to update future Bitcoin & Lightning node versions in-between Polar releases ([#267](https://github.com/jamaljsr/polar/pull/267))
- **network**: add ability to run multiple Bitcoin Core nodes in one network ([#257](https://github.com/jamaljsr/polar/pull/257))
- **network**: add ability to start and stop each node individually ([#258](https://github.com/jamaljsr/polar/pull/258))
- **payments**: add ability to create and pay basic invoices ([#254](https://github.com/jamaljsr/polar/pull/254))
- **bitcoind**: use tabs for the bitcoind sidebar and display RPC credentials ([#256](https://github.com/jamaljsr/polar/pull/256))
- **i18n**: add translations for 9 languages via Crowdin ([#261](https://github.com/jamaljsr/polar/pull/261))

### Bug Fixes

- **ui**: disable "Close channel" button if opening channel to self ([#247](https://github.com/jamaljsr/polar/issues/247)), closes [#246](https://github.com/jamaljsr/polar/issues/246) by [@bolatovumar](https://github.com/bolatovumar)
- **i18n**: correct spanish translations ([#245](https://github.com/jamaljsr/polar/issues/245)) by [@federicobond](https://github.com/federicobond)

### Docs

- **readme:** add some future plans to the readme ([d875529](https://github.com/jamaljsr/polar/commit/d8755294af01d4f15e441c737e544dafa9bf31c2))
- **readme:** add Crowdin information to the readme ([69c89ee](https://github.com/jamaljsr/polar/commit/69c89ee1803f752902f07287a6419c155bcc9e5e))

### Community Contributions

Polar received contributions from a few community members. I'd like to sincerely thank these devs for giving back to the project.

- Federico Bond [@federicobond](https://github.com/federicobond)
- Umar Bolatov [@bolatovumar](https://github.com/bolatovumar)
- Will O'Beirne [@wbobeirne](https://github.com/wbobeirne)
- Otto Suess [@ottosuess](https://github.com/ottosuess)

All feedback and contributions are greatly appreciated.

## v0.1.0

### First Release

This first stable release of Polar contains the following features:

- Create a regtest Lightning Network in just a few clicks
- Connect from your app to the lightning nodes via RPC
- Launch a terminal in each bitcoin/lightning node
- Add more nodes using drag & drop
- Open & Close Channels
- Manually mine new blocks
- Deposit regtest coins into each Lightning node
- Multiple language support with English & Spanish (translations need improvement)
- Multiple OS support for Mac, Windows & Linux
