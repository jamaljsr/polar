# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.2.0](https://github.com/jamaljsr/polar/compare/v0.1.0...v0.2.0) (2019-12-21)

This released was focused on adding features that didn't make it in the first release, as well as some stability improvements. There are new and updated node versions as well as many more language translations included. Languages can now be crowd-sourced via Crowdin. See the [README](https://github.com/jamaljsr/polar#help-translate) for more details.

In the next release, I plan on tackling some of the great feature requests submitted since the initial launch. If you have any suggestions or use-cases you'd like to see improved with Polar, please don't hesitate to open an issue.

### ⚠ BREAKING CHANGES

With c-lighting changing the folder structure of their dataDir in v0.8.0, lightningd was unable to create the lightning-rpc socket file due to 'path too long' errors on Mac. Polar previously stored the data for nodes in ~/Library/Application Support/polar/data/networks/. This has now been changed to ~/.polar on all OS's. Due to this change, networks that were created in Polar v0.1.0 will no longer be displayed in the app. They will need to be mnually moved or re-created.

To move the previous networks to the new location, you must stop any running networks and close the Polar app. Then move the 'networks' folder depending on your OS to the new location:

Location in v0.1.0

- Mac: `~/Library/Application Support/polar/data/networks/`
- Linux: `~/config/polar/data/networks/`
- Windows: `~/AppData/Roaming/polar/data/networks/`

New location in v0.2.0

- All OS's: `~/.polar/networks/`

### Features

- **network**: add support for c-lightning v0.7.3 ([#251](https://github.com/jamaljsr/polar/pull/251)) and v0.8.0 ([#259](https://github.com/jamaljsr/polar/pull/259))
- **network**: add support for LND v0.8.2-beta ([#257](https://github.com/jamaljsr/polar/pull/257))
- **network**: add support for Bitcoin Core v0.19.0.1 ([#257](https://github.com/jamaljsr/polar/pull/257))
- **network**: add ability to run multiple Bitcoin Core nodes in one network ([#257](https://github.com/jamaljsr/polar/pull/257))
- **network**: add ability to start and stop each node individually ([#258](https://github.com/jamaljsr/polar/pull/258))
- **payments**: add ability to create and pay basic invoices ([#254](https://github.com/jamaljsr/polar/pull/254))
- **bitcoind**: use tabs for the bitcoind sidebar and display RPC credentials ([#256](https://github.com/jamaljsr/polar/pull/256))
- **i18n**: add translations for 9 languages via Crowdin ([#261](https://github.com/jamaljsr/polar/pull/261))

### Bug Fixes

- **ui**: disable "Close channel" button if opening channel to self ([#247](https://github.com/jamaljsr/polar/issues/247)), closes [#246](https://github.com/jamaljsr/polar/issues/246)
- **i18n**: correct spanish translations ([#245](https://github.com/jamaljsr/polar/issues/245))

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

## 0.1.0 (2019-11-09)

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
