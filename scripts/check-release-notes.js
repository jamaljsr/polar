#!/usr/bin/env node
/*
 * Release note check for pull requests. See docs/release-notes/README.md.
 *
 * Rules (modelled on LND's release note fragments):
 *  - A PR with a feat, fix or perf change (or a breaking change) must add
 *    docs/release-notes/unreleased/<PR number>.md, unless the PR description
 *    ticks the "No release note needed" box.
 *  - Every fragment must start with a heading taken from
 *    docs/release-notes/template.md, every heading must have an entry under it,
 *    and the PR's own fragment must link to the PR.
 *  - Fragments added by a PR must be named after that PR.
 *  - Regular PRs must not edit CHANGELOG.md (it is written at release time) or
 *    delete fragments, unless they revert a change.
 *  - Release PRs must not leave any fragments behind.
 *
 * Usage in CI: configured through env vars (see .github/workflows/release-notes.yml).
 * Usage locally:
 *   node scripts/check-release-notes.js --pr 1234 [--base origin/master] [--title "fix: foo"]
 * Tests: node --test scripts/check-release-notes.test.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const {
  UNRELEASED_DIR,
  TEMPLATE,
  isFragmentPath,
  isFragmentName,
  parseHeadings,
  parseFragment,
  fragmentProblems,
} = require('./release-notes-lib');

const CHANGELOG = 'CHANGELOG.md';
// commit types that always need a release note
const NOTE_TYPES = ['feat', 'fix', 'perf'];
const WAIVER = /^\s*[-*]\s*\[x\]\s*no release note needed/im;
// the two spellings Conventional Commits allows for a breaking change footer
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:\s/m;

const arg = (name, envName) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return process.env[envName] || '';
};

// stderr is captured so an expected failure stays out of the log. Unexpected ones still throw it
const git = args =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const pr = arg('pr', 'PR_NUMBER');
const base = arg('base', 'BASE_SHA') || 'origin/master';
const head = arg('head', 'HEAD_SHA') || 'HEAD';
const title = arg('title', 'PR_TITLE');
const body = process.env.PR_BODY || '';
const author = process.env.PR_AUTHOR || '';
const headRef = process.env.PR_HEAD_REF || '';
const repo = process.env.GITHUB_REPOSITORY || 'jamaljsr/polar';

if (!/^\d+$/.test(pr)) {
  console.error('Pass the pull request number: --pr <number> (or set PR_NUMBER)');
  process.exit(2);
}

// Renovate bumps never carry a release note
if (author === 'renovate[bot]') {
  console.log('Release note not required for this pull request.');
  process.exit(0);
}

// a release folds the fragments into the changelog, so anything left would be announced late
if (headRef.startsWith('release/')) {
  const left = git(['ls-tree', '--name-only', head, `${UNRELEASED_DIR}/`])
    .split('\n')
    .filter(file => file && isFragmentPath(file));
  if (left.length) {
    console.error(
      `Release note check failed:\n\nRun yarn release:notes to fold these into ` +
        `${CHANGELOG}:\n- ${left.join('\n- ')}`,
    );
    process.exit(1);
  }
  console.log('Release note not required for this pull request.');
  process.exit(0);
}

const errors = [];
const ownFile = `${UNRELEASED_DIR}/${pr}.md`;

const readAtHead = file => {
  try {
    return git(['show', `${head}:${file}`]);
  } catch (e) {
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  }
};

const parseType = subject => {
  const m = /^(\w+)(?:\([^)]*\))?(!)?:\s/.exec(subject.trim());
  return m ? { type: m[1].toLowerCase(), breaking: !!m[2] } : null;
};

const template = readAtHead(TEMPLATE);
if (template === null) {
  console.error(`Cannot find ${TEMPLATE}`);
  process.exit(2);
}
const headings = parseHeadings(template);

const subjects = git(['log', '--format=%s', `${base}..${head}`])
  .split('\n')
  .filter(Boolean);
const titles = [...subjects, title];

// files changed by the PR, as [status, path]. A rename is reported as a delete and an add
const changes = git(['diff', '--no-renames', '--name-status', `${base}...${head}`])
  .split('\n')
  .filter(Boolean)
  .map(line => line.split('\t'));

if (changes.some(([, file]) => file === CHANGELOG)) {
  errors.push(
    `${CHANGELOG} is written when a release is prepared. Remove your changes to it ` +
      `and add a fragment under ${UNRELEASED_DIR}/ instead.`,
  );
}

const isRevert = titles.some(t => /^revert\b/i.test(t.trim()));

for (const [status, file] of changes) {
  if (status === 'D' && isFragmentPath(file) && !isRevert) {
    errors.push(
      `${file}: fragments are deleted when a release is prepared. Restore this file, ` +
        `or it will be missing from the release notes.`,
    );
  }
}

const fragments = changes.filter(
  ([status, file]) => status !== 'D' && isFragmentPath(file),
);

for (const [status, file] of fragments) {
  if (!isFragmentName(file.slice(UNRELEASED_DIR.length + 1))) {
    errors.push(`${file}: fragments must be named <PR number>.md`);
    continue;
  }
  if (status === 'A' && file !== ownFile) {
    errors.push(`${file}: a fragment added by this PR must be named ${pr}.md`);
  }
  const source = readAtHead(file) || '';
  fragmentProblems(source, headings).forEach(p => errors.push(`${file}: ${p}`));
  const { text } = parseFragment(source);
  if (file === ownFile && !new RegExp(`/pull/${pr}(?!\\d)`).test(text)) {
    errors.push(
      `${file}: the entry must link to this PR (https://github.com/${repo}/pull/${pr})`,
    );
  }
}

// does this PR change something users will notice?
const needsNote =
  BREAKING_FOOTER.test(git(['log', '--format=%B', `${base}..${head}`])) ||
  titles.map(parseType).some(t => t && (t.breaking || NOTE_TYPES.includes(t.type)));
const hasOwn = fragments.some(([, file]) => file === ownFile);

if (needsNote && !hasOwn && !WAIVER.test(body)) {
  errors.push(
    `This PR has a feat, fix, perf or breaking change but no release note.\n\n` +
      `Create ${ownFile} like this:\n\n` +
      `  # Features\n\n` +
      `  - Short, plain description of what users will notice ` +
      `([#${pr}](https://github.com/${repo}/pull/${pr}))\n\n` +
      `Headings: ${headings.join(', ')}.\n` +
      `If users will not notice this change, tick "No release note needed" in the PR description.`,
  );
}

if (errors.length) {
  console.error('Release note check failed:\n');
  errors.forEach(e => console.error(`- ${e}\n`));
  console.error('See docs/release-notes/README.md for details.');
  if (process.env.GITHUB_ACTIONS) {
    console.log(
      `::error title=Release note::${errors.length} problem(s), see the log above`,
    );
  }
  process.exit(1);
}

console.log(
  needsNote || hasOwn
    ? 'Release note check passed.'
    : 'No release note needed for this PR.',
);
