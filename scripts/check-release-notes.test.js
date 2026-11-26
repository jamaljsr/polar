/*
 * Tests for check-release-notes.js. Each test builds a small git repo and runs the real
 * script against it. These run with Node's test runner, because Polar's Jest setup only
 * covers src/:
 *
 *   node --test scripts/check-release-notes.test.js
 */
const assert = require('node:assert');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const SCRIPT = path.join(__dirname, 'check-release-notes.js');
const TEMPLATE = path.join(__dirname, '../docs/release-notes/template.md');
const UNRELEASED = 'docs/release-notes/unreleased';

// keep the script and git independent of the machine and of the CI job running the tests
const baseEnv = () => {
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: os.devNull,
    GIT_CONFIG_SYSTEM: os.devNull,
    GIT_AUTHOR_NAME: 'test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
  };
  Object.keys(env)
    .filter(key => /^(PR_|GITHUB_)|^(BASE|HEAD)_SHA$/.test(key))
    .forEach(key => delete env[key]);
  return env;
};

// creates a repo with one commit on master and a `pr` branch checked out
const setup = t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd: dir, env: baseEnv() });
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  const commit = (subject, files = {}) => {
    Object.entries(files).forEach(([file, text]) => write(file, text));
    git('add', '-A');
    git('commit', '--allow-empty', '-qm', subject);
  };
  git('init', '-q', '-b', 'master');
  write('docs/release-notes/template.md', fs.readFileSync(TEMPLATE, 'utf8'));
  write(`${UNRELEASED}/README.md`, '# Unreleased Changes\n');
  write('CHANGELOG.md', '# Changelog\n');
  commit('chore: init');
  git('checkout', '-qb', 'pr');
  const check = (env = {}) => {
    const result = spawnSync(process.execPath, [SCRIPT], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...baseEnv(), PR_NUMBER: '123', BASE_SHA: 'master', ...env },
    });
    return { code: result.status, output: result.stdout + result.stderr };
  };
  return { dir, git, write, commit, check };
};

const note = (heading = 'Bug Fixes', number = 123) =>
  `# ${heading}\n\n- Something better ([#${number}](https://github.com/jamaljsr/polar/pull/${number}))\n`;
const own = `${UNRELEASED}/123.md`;

// creates master with fragment 99 on it, and a `pr` branch from there
const withEarlierFragment = t => {
  const repo = setup(t);
  repo.git('checkout', '-q', 'master');
  repo.commit('feat: earlier', { [`${UNRELEASED}/99.md`]: note('Features', 99) });
  repo.git('checkout', '-qB', 'pr');
  return repo;
};

const passes = result => assert.strictEqual(result.code, 0, result.output);
const fails = (result, message) => {
  assert.strictEqual(result.code, 1, result.output);
  assert.match(result.output, message);
};

for (const subject of [
  'feat: new',
  'fix(ui): broken',
  'perf: faster',
  'chore!: breaking',
]) {
  test(`requires a note for "${subject}"`, t => {
    const { commit, check } = setup(t);
    commit(subject);
    fails(check(), /no release note/);
  });
}

for (const subject of [
  'chore(deps): bump',
  'docs: typo',
  'test: more',
  'refactor: tidy',
]) {
  test(`does not require a note for "${subject}"`, t => {
    const { commit, check } = setup(t);
    commit(subject);
    passes(check());
  });
}

for (const footer of ['BREAKING CHANGE', 'BREAKING-CHANGE']) {
  test(`requires a note for a ${footer} footer`, t => {
    const { commit, check } = setup(t);
    commit(`refactor: remove old option\n\nSome context.\n\n${footer}: it is gone`);
    fails(check(), /no release note/);
  });
}

for (const text of [
  'It is not a BREAKING CHANGE: just tidying',
  'Breaking change: none',
]) {
  test(`does not treat "${text}" as a breaking change`, t => {
    const { commit, check } = setup(t);
    commit(`refactor: tidy\n\n${text}`);
    passes(check());
  });
}

test('checks the PR title as well as its commits', t => {
  const { commit, check } = setup(t);
  commit('chore: tidy');
  fails(check({ PR_TITLE: 'fix: broken' }), /no release note/);
});

test('reads a ticked waiver with the line endings GitHub sends', t => {
  const { commit, check } = setup(t);
  commit('fix: internal');
  passes(check({ PR_BODY: 'text\r\n- [X] No release note needed\r\n' }));
});

test('ignores an unticked waiver', t => {
  const { commit, check } = setup(t);
  commit('fix: internal');
  fails(
    check({ PR_BODY: 'text\r\n- [ ] No release note needed\r\n' }),
    /no release note/,
  );
});

for (const heading of ['Features', 'Bug Fixes', 'Node Updates', 'Docs']) {
  test(`accepts the "${heading}" heading`, t => {
    const { commit, check } = setup(t);
    commit('feat: new', { [own]: note(heading) });
    passes(check());
  });
}

for (const heading of ['Improvements', 'Breaking Changes', 'Contributors']) {
  test(`rejects the "${heading}" heading`, t => {
    const { commit, check } = setup(t);
    commit('feat: new', { [own]: note(heading) });
    fails(check(), /unknown heading/);
  });
}

test('accepts several headings in one file', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [own]: `${note('Features')}\n${note('Bug Fixes')}` });
  passes(check());
});

test('rejects a heading with no entry', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [own]: `# Features\n\n${note('Bug Fixes')}` });
  fails(check(), /add an entry under "# Features"/);
});

for (const inner of ['## 9.9.9', '### Features', '#### Details']) {
  test(`rejects "${inner}" inside an entry`, t => {
    const { commit, check } = setup(t);
    commit('feat: new', { [own]: `${note('Features')}\n${inner}\n\n- Second\n` });
    fails(check(), /remove the smaller heading/);
  });
}

test('does not mistake an issue number for a heading', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [own]: `${note('Features')}\n#1234 is also fixed\n` });
  passes(check());
});

test('does not count a comment as an entry or a link', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [own]: '# Features\n\n<!-- /pull/123 -->\n' });
  const result = check();
  fails(result, /add an entry/);
  fails(result, /must link to this PR/);
});

test('requires the file to start with a heading', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [own]: 'Something by @me in /pull/123\n' });
  fails(check(), /must start with a top-level heading/);
});

test('requires the link to be this exact PR', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [own]: note('Features', 1234) });
  fails(check(), /must link to this PR/);
});

test('rejects a fragment named after another PR', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [`${UNRELEASED}/456.md`]: note('Features', 456), [own]: note() });
  fails(check(), /must be named 123\.md/);
});

test('rejects a fragment that is not named after a PR', t => {
  const { commit, check } = setup(t);
  commit('feat: new', { [`${UNRELEASED}/my-change.md`]: note(), [own]: note() });
  fails(check(), /must be named <PR number>\.md/);
});

test('allows extending the fragment of an earlier PR', t => {
  const { commit, check } = withEarlierFragment(t);
  commit('docs: extend', { [`${UNRELEASED}/99.md`]: `${note('Features', 99)}- More\n` });
  passes(check());
});

test('rejects edits to the changelog', t => {
  const { commit, check } = setup(t);
  commit('chore: tidy', { 'CHANGELOG.md': '# Changelog\n\nedited\n' });
  fails(check(), /CHANGELOG\.md is written when a release is prepared/);
});

test('rejects deleting a fragment', t => {
  const { git, commit, check } = withEarlierFragment(t);
  git('rm', '-q', `${UNRELEASED}/99.md`);
  commit('chore: tidy');
  fails(check(), /fragments are deleted when a release is prepared/);
});

test('rejects renaming a fragment', t => {
  const { git, commit, check } = withEarlierFragment(t);
  git('mv', `${UNRELEASED}/99.md`, `${UNRELEASED}/100.md`);
  commit('chore: tidy');
  const result = check();
  fails(result, /fragments are deleted when a release is prepared/);
  fails(result, /must be named 123\.md/);
});

for (const subject of ['revert: feat: earlier', 'Revert "feat: earlier"']) {
  test(`allows deleting a fragment in "${subject}"`, t => {
    const { git, commit, check } = withEarlierFragment(t);
    git('rm', '-q', `${UNRELEASED}/99.md`);
    commit(subject);
    passes(check());
  });
}

test('exempts release branches, which fold fragments into the changelog', t => {
  const { git, commit, check } = withEarlierFragment(t);
  git('rm', '-q', `${UNRELEASED}/99.md`);
  commit('chore(release): bump version', { 'CHANGELOG.md': '# Changelog\n\n## 2.0.0\n' });
  passes(check({ PR_HEAD_REF: 'release/v2.0.0' }));
});

test('rejects a release branch that leaves a fragment behind', t => {
  const { commit, check } = withEarlierFragment(t);
  commit('chore(release): bump version', { 'CHANGELOG.md': '# Changelog\n\n## 2.0.0\n' });
  fails(check({ PR_HEAD_REF: 'release/v2.0.0' }), /yarn release:notes[\s\S]*99\.md/);
});

test('does not treat the README in the unreleased directory as a fragment', t => {
  const { commit, check } = setup(t);
  commit('docs: explain', { [`${UNRELEASED}/README.md`]: 'Not a fragment\n' });
  passes(check());
  passes(check({ PR_HEAD_REF: 'release/v2.0.0' }));
});

test('allows a docs PR to add an optional note', t => {
  const { commit, check } = setup(t);
  commit('docs: new guide', { [own]: note('Docs') });
  passes(check());
});

test('exempts Renovate', t => {
  const { commit, check } = setup(t);
  commit('fix(deps): bump');
  passes(check({ PR_AUTHOR: 'renovate[bot]' }));
});

test('uses the checked out template when the PR branch predates it', t => {
  const { dir, git, commit, write, check } = setup(t);
  git('rm', '-q', 'docs/release-notes/template.md');
  commit('chore: branch from before release notes', { [own]: note('Features') });
  write('docs/release-notes/template.md', fs.readFileSync(TEMPLATE, 'utf8'));
  assert.ok(fs.existsSync(path.join(dir, 'docs/release-notes/template.md')));
  passes(check());
});

test('requires a PR number', t => {
  const { check } = setup(t);
  const result = check({ PR_NUMBER: '' });
  assert.strictEqual(result.code, 2, result.output);
});
