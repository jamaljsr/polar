# Release Notes

Release notes are written when a change is made, not when a release is cut. Every pull request that
users will notice adds one small Markdown file to `docs/release-notes/unreleased/`. The files are
not tied to a version. When a release is prepared, one command folds every file into the
`CHANGELOG.md` section of that release and deletes them, so a change is announced in the first
release that ships it.

This does two jobs:

- **It tells users what is on `master`.** Releases can be far apart, so the
  [unreleased folder](unreleased) lists what has been merged since the last one, for anyone who
  wants to build a change from source before it is released.
- **It keeps releases cheap.** The notes are already written when a release is prepared, and the
  credits are generated.

This is the approach LND uses, which is itself based on Bitcoin Core's release note process. One
file per pull request means contributors never edit the same file, so there are no merge conflicts.

## Adding an Entry

Create a file named after your pull request number:

```
docs/release-notes/unreleased/<PR number>.md
```

You only know the number after opening the PR, so add the file in a follow-up commit. For a PR
numbered `1234`, the file `unreleased/1234.md` could look like this:

```
# Bug Fixes

- Fix node containers failing to start on Windows ([#1234](https://github.com/jamaljsr/polar/pull/1234))
```

Rules:

- Name the file `<PR number>.md`. If your PR needs entries under several headings, put them all in
  the same file.
- Start the file with a heading from [template.md](template.md). These match the sections of
  `CHANGELOG.md`. Copy only the headings you need, and put at least one entry under each.
  - **Features**: anything new or better that users will notice, including performance.
  - **Bug Fixes**: something that was broken and now works.
  - **Node Updates**: support for a new node version.
  - **Docs**: optional, for documentation changes worth mentioning.
- Write for users, in plain language. Describe what changes for them, not how the code changed. If
  the change is breaking, say so in the entry.
- Link your PR in every entry.
- Do not credit yourself. The contributors list is generated at release time from the authors and
  co-authors of the commits, so everyone is credited, including for changes that have no release
  note.
- Do not edit `CHANGELOG.md`. It is written when a release is prepared.
- Do not delete another PR's file, unless your PR reverts that change.

## When a Release Note Is Needed

A pull request needs a release note if any of its commits (or its title) uses the type `feat`, `fix`
or `perf`, or is a breaking change (`type!:`). Commits of type `docs`, `test`, `refactor`, `style`,
`build`, `ci` and `chore` do not need one, and neither do Renovate pull requests.

If a `fix` or `feat` PR is internal only and users will not notice it, tick **No release note
needed** in the PR description.

## Checking Your PR

The `Release Notes` check runs on every pull request into `master` and tells you exactly what to
add. A PR that merges a long-lived branch into `master` needs one file, named after that PR.

You can run the same check locally after committing your file. It compares your branch with the
base you pass, so fetch the latest `master` first, because your fork's copy may be behind:

```
git fetch https://github.com/jamaljsr/polar.git master
yarn check:release-notes --pr <PR number> --base FETCH_HEAD
```

If you change these scripts, run their tests with:

```
node --test scripts/*.test.js
```

## Preparing a Release

This is a step in [RELEASE.md](../../RELEASE.md). On the release branch, after `yarn release`:

```
yarn release:notes
```

In the new version's section of `CHANGELOG.md`, this:

1. Replaces the commit list from `yarn release` with the entries from each file in
   `docs/release-notes/unreleased/`, under the matching heading and ordered by PR number. `Docs`
   lines from `yarn release` stay, because docs changes don't need a release note.
2. Adds a `Contributors` list with everyone who authored or co-authored a commit since the previous
   release. Bots and merge commits are skipped. Pass `--from <tag>` to compare from a different
   release.
3. Deletes the folded files.

It reads the commit authors from the GitHub API, which works without a token. Set `GITHUB_TOKEN` if
you hit the rate limit. If anything is wrong, such as a fragment with an unknown heading, it tells
you and changes nothing.

Review the result and edit it freely. Add a summary at the top and tidy the wording. If a
co-author's handle can't be found, they are listed by name, so change it to their handle if you know
it. A handle is found from a GitHub `noreply` address in their `Co-authored-by:` line, or from a
commit in the same release that they authored with the same email.

You can run it again, for example after rebasing the release branch onto a bug fix from `master`.
New entries and contributors are added, and your edits are kept. The check fails on a release PR
that still has files in `docs/release-notes/unreleased/`, so nothing is announced a release late.
