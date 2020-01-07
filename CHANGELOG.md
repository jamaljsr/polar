# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.2.0](https://github.com/jamaljsr/polar/compare/v0.1.0...v0.2.0)

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

## 0.1.0

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
