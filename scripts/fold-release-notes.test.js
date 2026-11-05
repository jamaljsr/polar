/*
 * Tests for fold-release-notes.js. Each test builds a small git repo, serves a fake GitHub
 * API locally, and runs the real script against both:
 *
 *   node --test scripts/fold-release-notes.test.js
 */
const assert = require('node:assert');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const SCRIPT = path.join(__dirname, 'fold-release-notes.js');
const TEMPLATE = path.join(__dirname, '../docs/release-notes/template.md');
const UNRELEASED = 'docs/release-notes/unreleased';
const COMMIT = 'https://github.com/jamaljsr/polar/commit';

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
    .filter(key => key.startsWith('GITHUB_'))
    .forEach(key => delete env[key]);
  return env;
};

const note = (number, heading = 'Features') =>
  `# ${heading}\n\n- Change ${number} ([#${number}](https://github.com/jamaljsr/polar/pull/${number}))\n`;

// what `yarn release` writes above the older sections
const GENERATED = [
  '## [2.0.0](https://github.com/jamaljsr/polar/compare/v1.0.0...v2.0.0) (2026-11-04)',
  '',
  '',
  '### ⚠ BREAKING CHANGES',
  '',
  '* the old flag is gone',
  '',
  '### Features',
  '',
  `* add a thing ([06c768c](${COMMIT}/06c768c38651909707d359c491ad229d270b302d))`,
  `* **ui:** add another ([#12](https://example.com/12)) ([736f159](${COMMIT}/736f159be0145532bea86156ddb9e50bebc8cfa5))`,
  '',
  '',
  '### Performance',
  '',
  `* go faster ([ee3ae49](${COMMIT}/ee3ae493d61349c324231f4f704e8e6c394b6643))`,
  '',
  '',
  '### Docs',
  '',
  `* explain a thing ([4205185](${COMMIT}/42051853444d731492f80be554d8ad1b3837d753))`,
].join('\n');
const OLD =
  '## [1.0.0](https://github.com/jamaljsr/polar/compare/v0.9.0...v1.0.0)\n\n### Features\n\n- Old\n';

const setup = t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, { cwd: dir, env: baseEnv(), encoding: 'utf8' }).trim();
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  };
  const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
  const exists = file => fs.existsSync(path.join(dir, file));
  const commit = subject => {
    git('add', '-A');
    git('commit', '--allow-empty', '-qm', subject);
    return git('rev-parse', 'HEAD');
  };
  const writeChangelog = section =>
    write('CHANGELOG.md', `# Changelog\n\nIntro.\n\n${section}\n\n${OLD}`);

  git('init', '-q', '-b', 'master');
  write('package.json', '{ "version": "2.0.0" }\n');
  write('docs/release-notes/template.md', fs.readFileSync(TEMPLATE, 'utf8'));
  write(`${UNRELEASED}/README.md`, '# Unreleased Changes\n');
  writeChangelog(GENERATED);
  commit('chore: init');
  git('tag', 'v1.0.0');

  // the fake GitHub API. Tests set `api.commits` or `api.status`
  const api = { commits: [], status: 200, urls: [], perPage: 100 };
  const server = http.createServer((req, res) => {
    api.urls.push(req.url);
    const url = new URL(req.url, 'http://localhost');
    const page = Number(url.searchParams.get('page'));
    const offset = (page - 1) * api.perPage;
    res.statusCode = api.status;
    res.end(
      JSON.stringify({
        total_commits: api.commits.length,
        commits: api.commits.slice(offset, offset + api.perPage),
      }),
    );
  });
  t.after(() => server.close());

  const fold = async (...args) => {
    if (!server.listening) {
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    }
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: dir,
      env: {
        ...baseEnv(),
        GITHUB_API_URL: `http://127.0.0.1:${server.address().port}`,
      },
    });
    let output = '';
    child.stdout.on('data', data => (output += data));
    child.stderr.on('data', data => (output += data));
    const code = await new Promise(resolve => child.on('close', resolve));
    return { code, output };
  };

  return { git, write, read, exists, commit, writeChangelog, api, fold };
};

const person = (sha, login) => ({
  sha,
  author: { login, type: 'User' },
  commit: {
    author: { name: login, email: `${login}@example.com` },
    message: 'feat: something',
  },
  parents: [{}],
});

const coAuthored = (sha, ...trailers) => {
  const commit = person(sha, 'author');
  commit.commit.message = `feat: a\n\nBody.\n\n${trailers.join('\n')}\n`;
  return commit;
};

// the new version's section of the changelog
const section = changelog =>
  changelog.slice(changelog.indexOf('## [2.0.0]'), changelog.indexOf('## [1.0.0]'));

const passes = result => assert.strictEqual(result.code, 0, result.output);

test('replaces the generated commits with the fragments, by PR number', async t => {
  const { write, read, fold } = setup(t);
  write(`${UNRELEASED}/1000.md`, note(1000));
  write(`${UNRELEASED}/99.md`, note(99));
  write(`${UNRELEASED}/500.md`, note(500, 'Bug Fixes'));
  passes(await fold());
  const result = section(read('CHANGELOG.md'));
  assert.doesNotMatch(result, /add a thing|add another|go faster/);
  assert.doesNotMatch(result, /### Performance/);
  assert.ok(result.indexOf('Change 99') < result.indexOf('Change 1000'));
  assert.ok(result.indexOf('Change 1000') < result.indexOf('### Bug Fixes'));
  assert.ok(result.indexOf('### Bug Fixes') < result.indexOf('Change 500'));
});

test('writes entries as one list, like the rest of the changelog', async t => {
  const { write, read, fold } = setup(t);
  write(`${UNRELEASED}/99.md`, note(99));
  write(`${UNRELEASED}/100.md`, note(100));
  passes(await fold());
  assert.match(
    section(read('CHANGELOG.md')),
    /### Features\n\n- Change 99 [^\n]*\n- Change 100 [^\n]*\n\n### /,
  );
});

test('keeps generated docs and breaking changes', async t => {
  const { read, fold } = setup(t);
  passes(await fold());
  const result = section(read('CHANGELOG.md'));
  assert.match(result, /### Docs\n\n\* explain a thing/);
  assert.match(result, /### ⚠ BREAKING CHANGES\n\n\* the old flag is gone/);
  assert.ok(result.indexOf('BREAKING') < result.indexOf('### Docs'));
});

test('adds an optional docs note beside the generated docs lines', async t => {
  const { write, read, fold } = setup(t);
  write(`${UNRELEASED}/7.md`, note(7, 'Docs'));
  passes(await fold());
  const result = section(read('CHANGELOG.md'));
  assert.match(result, /### Docs\n\n\* explain a thing[\s\S]*Change 7/);
});

test('deletes the fragments and keeps the directory README', async t => {
  const { write, exists, read, fold } = setup(t);
  write(`${UNRELEASED}/99.md`, note(99));
  passes(await fold());
  assert.ok(!exists(`${UNRELEASED}/99.md`));
  assert.ok(exists(`${UNRELEASED}/README.md`));
  assert.doesNotMatch(read('CHANGELOG.md'), /Unreleased Changes/);
});

test('leaves the rest of the changelog alone', async t => {
  const { write, read, fold } = setup(t);
  write(`${UNRELEASED}/99.md`, note(99));
  passes(await fold());
  const result = read('CHANGELOG.md');
  assert.ok(result.startsWith('# Changelog\n\nIntro.\n\n## [2.0.0]'));
  assert.ok(result.endsWith(OLD));
});

test('credits every author once, including docs and test contributors', async t => {
  const { commit, read, api, fold } = setup(t);
  const a = commit('feat: a');
  const b = commit('test: b');
  const c = commit('docs: c');
  const d = commit('fix: d');
  api.commits = [person(a, 'zed'), person(b, 'Ann'), person(c, 'bob'), person(d, 'zed')];
  passes(await fold());
  assert.match(
    section(read('CHANGELOG.md')),
    /### Contributors\n\n- @Ann\n- @bob\n- @zed\n/,
  );
});

test('does not credit bots or merge commits', async t => {
  const { commit, read, api, fold } = setup(t);
  const a = commit('chore(deps): a');
  const b = commit('chore: b');
  const c = commit('Merge pull request #1');
  const d = commit('feat: d');
  api.commits = [
    { ...person(a, 'renovate[bot]'), author: { login: 'renovate[bot]', type: 'Bot' } },
    { ...person(b, 'some-app'), author: { login: 'some-app', type: 'Bot' } },
    { ...person(c, 'maintainer'), parents: [{}, {}] },
    person(d, 'human'),
  ];
  passes(await fold());
  const contributors = read('CHANGELOG.md').split('### Contributors')[1].split('##')[0];
  assert.strictEqual(contributors.trim(), '- @human');
});

test('falls back to the name for a commit with no GitHub account', async t => {
  const { commit, read, api, fold } = setup(t);
  const sha = commit('feat: a');
  api.commits = [
    {
      sha,
      author: null,
      commit: {
        author: { name: 'Jane Doe', email: 'jane@example.com' },
        message: 'feat: a',
      },
      parents: [{}],
    },
  ];
  passes(await fold());
  assert.match(read('CHANGELOG.md'), /### Contributors\n\n- Jane Doe\n/);
});

test('credits co-authors, by handle when their email reveals it', async t => {
  const { commit, read, api, fold } = setup(t);
  api.commits = [
    coAuthored(
      commit('feat: a'),
      'Co-authored-by: Some Name <1356600+handle@users.noreply.github.com>',
      'co-authored-by: Old Style <old-style@users.noreply.github.com>',
      'Co-Authored-By: Andrew Oseen <amovfx@protonmail.com>',
    ),
  ];
  passes(await fold());
  assert.match(
    read('CHANGELOG.md'),
    /### Contributors\n\n- Andrew Oseen\n- @author\n- @handle\n- @old-style\n/,
  );
});

test('finds a co-author by their email on a commit they authored', async t => {
  const { commit, read, api, fold } = setup(t);
  const authored = person(commit('feat: a'), 'amovfx');
  authored.commit.author.email = 'Personal@Example.com';
  api.commits = [
    coAuthored(commit('fix: b'), 'Co-authored-by: Andrew <personal@example.com>'),
    authored,
  ];
  passes(await fold());
  const result = read('CHANGELOG.md');
  assert.strictEqual(result.match(/@amovfx/g).length, 1);
  assert.doesNotMatch(result, /- Andrew/);
});

test('does not credit an old bot account that GitHub reports as a user', async t => {
  const { commit, read, api, fold } = setup(t);
  api.commits = [
    person(commit('chore: a'), 'renovate-bot'),
    person(commit('feat: b'), 'human'),
  ];
  passes(await fold());
  const contributors = read('CHANGELOG.md').split('### Contributors')[1].split('##')[0];
  assert.strictEqual(contributors.trim(), '- @human');
});

test('does not treat a handle that only contains "bot" as a bot', async t => {
  const { commit, read, api, fold } = setup(t);
  api.commits = [person(commit('feat: a'), 'bot-builder')];
  passes(await fold());
  assert.match(read('CHANGELOG.md'), /- @bot-builder\n/);
});

test('does not credit tools as co-authors', async t => {
  const { commit, read, api, fold } = setup(t);
  api.commits = [
    coAuthored(
      commit('feat: a'),
      'Co-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>',
      'Co-authored-by: Renovate Bot <bot@renovateapp.com>',
      'Co-authored-by: Copilot <123+Copilot@users.noreply.github.com>',
      'Co-authored-by: An Assistant <noreply@example.com>',
    ),
  ];
  passes(await fold());
  const contributors = read('CHANGELOG.md').split('### Contributors')[1].split('##')[0];
  assert.strictEqual(contributors.trim(), '- @author');
});

test('credits a person who co-authored a commit by a bot', async t => {
  const { commit, read, api, fold } = setup(t);
  const bot = person(commit('chore(deps): a'), 'renovate[bot]');
  bot.commit.message =
    'chore(deps): a\n\nCo-authored-by: Human <9+human@users.noreply.github.com>';
  api.commits = [bot];
  passes(await fold());
  const contributors = read('CHANGELOG.md').split('### Contributors')[1].split('##')[0];
  assert.strictEqual(contributors.trim(), '- @human');
});

test('lists someone once if they are both an author and a co-author', async t => {
  const { commit, read, api, fold } = setup(t);
  api.commits = [
    person(commit('feat: a'), 'Same'),
    coAuthored(commit('feat: b'), 'Co-authored-by: x <1+same@users.noreply.github.com>'),
  ];
  passes(await fold());
  assert.strictEqual(read('CHANGELOG.md').match(/@same/gi).length, 1);
});

test('only reads the trailer at the start of a line', async t => {
  const { commit, read, api, fold } = setup(t);
  const sha = commit('feat: a');
  const quoted = person(sha, 'author');
  quoted.commit.message =
    'feat: a\n\nDocs: see Co-authored-by: Nobody <nobody@example.com>';
  api.commits = [quoted];
  passes(await fold());
  assert.doesNotMatch(read('CHANGELOG.md'), /Nobody/);
});

test('does not credit commits on master that this branch does not contain', async t => {
  const { commit, read, api, fold } = setup(t);
  const sha = commit('feat: a');
  api.commits = [person(sha, 'in-release'), person('f'.repeat(40), 'merged-later')];
  passes(await fold());
  const result = read('CHANGELOG.md');
  assert.match(result, /@in-release/);
  assert.doesNotMatch(result, /@merged-later/);
});

test('reads every page of commits', async t => {
  const { commit, read, api, fold } = setup(t);
  api.perPage = 1;
  api.commits = [person(commit('feat: a'), 'first'), person(commit('feat: b'), 'second')];
  passes(await fold());
  const result = read('CHANGELOG.md');
  assert.match(result, /@first/);
  assert.match(result, /@second/);
  assert.strictEqual(api.urls.length, 2);
});

test('compares from the previous final release, skipping release candidates', async t => {
  const { git, commit, api, fold } = setup(t);
  commit('feat: a');
  git('tag', 'v2.0.0-rc1');
  passes(await fold());
  assert.match(api.urls[0], /compare\/v1\.0\.0\.\.\.master/);
});

test('accepts the tag to compare from', async t => {
  const { git, commit, api, fold } = setup(t);
  git('tag', 'v0.5.0');
  commit('feat: a');
  passes(await fold('--from', 'v0.5.0'));
  assert.match(api.urls[0], /compare\/v0\.5\.0\.\.\.master/);
});

test('can be run again without losing or repeating anything', async t => {
  const { write, read, commit, writeChangelog, api, fold } = setup(t);
  const a = commit('feat: a');
  write(`${UNRELEASED}/99.md`, note(99));
  api.commits = [person(a, 'first')];
  passes(await fold());

  // the maintainer edits the result, and a fix lands after a rebase
  const edited = section(read('CHANGELOG.md'))
    .replace('### Features', 'A summary.\n\n### Features')
    .replace('- @first', '- @first\n- @coauthor');
  writeChangelog(edited.trim());
  const b = commit('fix: b');
  write(`${UNRELEASED}/100.md`, note(100, 'Bug Fixes'));
  api.commits.push(person(b, 'second'));
  passes(await fold());

  const result = section(read('CHANGELOG.md'));
  assert.match(result, /A summary\./);
  assert.match(result, /Change 100/);
  assert.match(result, /- @coauthor\n- @first\n- @second\n/);
  assert.strictEqual(result.match(/Change 99/g).length, 1);
  assert.strictEqual(result.match(/### Contributors/g).length, 1);

  // nothing new, so a third run leaves the changelog as it was
  const before = read('CHANGELOG.md');
  passes(await fold());
  assert.strictEqual(read('CHANGELOG.md'), before);
});

test('does not repeat an entry that was already folded', async t => {
  const { write, read, fold } = setup(t);
  write(`${UNRELEASED}/99.md`, note(99));
  passes(await fold());
  write(`${UNRELEASED}/99.md`, note(99));
  passes(await fold());
  assert.strictEqual(read('CHANGELOG.md').match(/Change 99/g).length, 1);
});

test('finds a patch release, which has a smaller heading', async t => {
  const { write, read, writeChangelog, fold } = setup(t);
  writeChangelog(
    `### [2.0.0](https://example.com) (2026-11-04)\n\n### Bug Fixes\n\n* x ([abc1234](${COMMIT}/abc1234))`,
  );
  write(`${UNRELEASED}/99.md`, note(99, 'Bug Fixes'));
  passes(await fold());
  const result = read('CHANGELOG.md');
  assert.match(result, /Change 99/);
  assert.doesNotMatch(result, /\* x /);
  assert.ok(result.endsWith(OLD));
});

const assertUnchanged = async (t, prepare, message) => {
  const repo = setup(t);
  repo.write(`${UNRELEASED}/99.md`, note(99));
  prepare(repo);
  const before = repo.read('CHANGELOG.md');
  const result = await repo.fold();
  assert.strictEqual(result.code, 1, result.output);
  assert.match(result.output, /Nothing was changed/);
  assert.match(result.output, message);
  assert.strictEqual(repo.read('CHANGELOG.md'), before);
  assert.ok(repo.exists(`${UNRELEASED}/99.md`));
};

test('changes nothing if GitHub cannot be reached', async t => {
  await assertUnchanged(
    t,
    ({ api }) => {
      api.status = 403;
    },
    /GitHub returned 403/,
  );
});

test('changes nothing if yarn release has not run', async t => {
  await assertUnchanged(
    t,
    ({ write }) => write('package.json', '{ "version": "3.0.0" }\n'),
    /starts with version 2\.0\.0, but package\.json is at 3\.0\.0/,
  );
});

test('changes nothing if a fragment has an unknown heading', async t => {
  await assertUnchanged(
    t,
    ({ write }) => write(`${UNRELEASED}/100.md`, note(100, 'Improvements')),
    /100\.md: unknown heading/,
  );
});

test('changes nothing if a fragment is misnamed', async t => {
  await assertUnchanged(
    t,
    ({ write }) => write(`${UNRELEASED}/my-change.md`, note(100)),
    /must be named <PR number>\.md/,
  );
});

test('changes nothing if this version is already released', async t => {
  await assertUnchanged(
    t,
    ({ git }) => git('tag', 'v2.0.0'),
    /Version 2\.0\.0 is already released/,
  );
});

test('changes nothing if there is no previous tag', async t => {
  await assertUnchanged(
    t,
    ({ git }) => git('tag', '-d', 'v1.0.0'),
    /Cannot find the previous release tag/,
  );
});
