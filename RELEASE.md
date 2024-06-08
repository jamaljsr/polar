## Polar Release Process

This document describes the steps to follow to create a new release of Polar and publish to the [Github Releases](https://github.com/jamaljsr/polar/releases) tab.

> Replace the version v.0.2.0 with the actual version number being released.

1. Create a Draft release on Github tagged with the next version number (ex: v0.2.0), and the title "Polar v0.2.0"
1. Create a new branch locally. The branch name must start with the prefix `release/` so that the electron builds will be published under the draft release created in step 1
   ```
   git checkout master
   git checkout -b release/v0.2.0
   ```
1. Update the version in `package.json` and the `CHANGELOG.md` file
   ```
   yarn release
   ```
1. Manually modify with `CHANGELOG.md` file to make it more presentable. Add a brief summary at the top and remove any unnecessary commits.
   Search for [merged PRs](https://github.com/jamaljsr/polar/pulls?q=is%3Apr+merged%3A%3E2023-04-19+-author%3Aapp%2Frenovate+) since the last release date to find the recent changes.
1. Modify the `README.md` file
   - add any updates to features and/or newly supported node versions
   - update the download links to point to the new urls
1. Update the [docker/nodes.json](./docker/nodes.json) file to mirror the `defaultRepoState` var in [src/utils/constants.ts](./src/utils/constants.ts)
1. Commit your changes
   ```
   git add .
   git commit -m "chore(release): bump version to v0.2.0 and update changelog"
   ```
1. Push your commit to Github
   ```
   git push --set-upstream origin release/v0.2.0
   ```
1. Confirm the CI build completes successfully and the binaries were uploaded to the draft release.
1. Download and test the binaries on all OS's (Mac, Linux & Windows)
1. If any bugs are found:
   - fix them in the master branch via a separate branch and PR
   - after that PR is merged, rebase the release branch on top of the latest master branch
     ```
     git checkout release/v0.2.0
     git pull --rebase origin master
     ```
   - Force-push the updated branch to Github
     ```
     git push -f
     ```
   - This will trigger a new build and create updated binaries to test and confirm the bugs are fixed
1. Create a PR for the `release/v0.2.0` branch and merge it into master after the build completes
1. Copy the release notes from the updated CHANGELOG.md file into the [Github Release](https://github.com/jamaljsr/polar/releases)
   - Update the first line since the content is redundant with what Github automatically displays
   - Before:
     ```
     ## [v0.2.0](https://github.com/jamaljsr/polar/compare/v0.1.0...v0.2.0) (2019-12-21)
     ```
   - After:
     ```
     > Full list of changes since `v0.1.0` [v0.1.0...v0.2.0](https://github.com/jamaljsr/polar/compare/v0.1.0...v0.2.0)
     ```
1. Publish the release
