#!/usr/bin/env node
/*
 * Folds the release note fragments into the new version's section of CHANGELOG.md. Run it
 * after `yarn release`. See docs/release-notes/README.md.
 *
 *  - Replaces the commit list `yarn release` generated with the fragments. Generated lines
 *    under Docs stay, because docs changes don't need a fragment.
 *  - Adds a Contributors list, generated from the authors and co-authors of the commits in
 *    this release.
 *  - Deletes the folded fragments.
 *
 * It changes nothing if anything is wrong, and it can be run again: a new fragment is added
 * to the section, and what is already there, including hand edits, is kept.
 *
 * Usage: node scripts/fold-release-notes.js [--from v4.0.0]
 * Tests: node --test scripts/fold-release-notes.test.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  UNRELEASED_DIR,
  TEMPLATE,
  UNRELEASED_README,
  isFragmentName,
  parseHeadings,
  parseFragment,
  fragmentProblems,
} = require('./release-notes-lib');

const CHANGELOG = 'CHANGELOG.md';
const CONTRIBUTORS = 'Contributors';
const DOCS = 'Docs';
const DEFAULT_BRANCH = 'master';
const REPO = process.env.GITHUB_REPOSITORY || 'jamaljsr/polar';
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com';
const VERSION_HEADING = /^#{1,3} \[?v?(\d+\.\d+\.\d+[^\]\s]*)/;
const GENERATED_COMMIT = /\/commit\/[0-9a-f]{7,40}\)\)/;
const PER_PAGE = 100;
const CO_AUTHOR = /^co-authored-by:\s*(.+?)\s*<([^>]+)>\s*$/gim;
// GitHub's private commit email contains the handle, as in 123+name@users.noreply.github.com
const NOREPLY_HANDLE = /^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i;
// tools rather than people, like `Renovate Bot <bot@...>` or `An AI <noreply@example.com>`
const AUTOMATED_NAME = /\[bot\]$|[-\s]bot$|^copilot$/i;
const AUTOMATED_EMAIL = /^(no-?reply|bot)@/i;

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

const argValue = name => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

const readFragments = headings => {
  const names = fs
    .readdirSync(UNRELEASED_DIR)
    .filter(name => `${UNRELEASED_DIR}/${name}` !== UNRELEASED_README)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const problems = [];
  const fragments = [];
  for (const name of names) {
    const file = `${UNRELEASED_DIR}/${name}`;
    if (!isFragmentName(name)) {
      problems.push(`${file}: fragments must be named <PR number>.md`);
      continue;
    }
    const source = fs.readFileSync(file, 'utf8');
    fragmentProblems(source, headings).forEach(p => problems.push(`${file}: ${p}`));
    fragments.push({ file, sections: parseFragment(source).sections });
  }
  if (problems.length) {
    throw new Error(`Fix these fragments first:\n- ${problems.join('\n- ')}`);
  }
  return fragments;
};

// the newest final release before this one. Release candidates don't reset the credits
const previousTag = () => {
  const tag = git('tag', '--merged', 'HEAD', '--sort=-v:refname')
    .split('\n')
    .find(t => /^v?\d+\.\d+\.\d+$/.test(t));
  if (!tag) throw new Error('Cannot find the previous release tag. Pass --from <tag>.');
  return tag;
};

// the people in a commit's Co-authored-by trailers, by handle where one can be found
const coAuthors = (message, handles) =>
  [...message.matchAll(CO_AUTHOR)].flatMap(([, name, email]) => {
    const noreply = NOREPLY_HANDLE.exec(email);
    const handle = noreply ? noreply[1] : handles.get(email.toLowerCase());
    if (AUTOMATED_NAME.test(handle || name) || AUTOMATED_EMAIL.test(email)) return [];
    return [handle ? `@${handle}` : name];
  });

// GitHub knows the handle behind each commit, which git history alone does not
const fetchContributors = async from => {
  // only credit commits this branch contains, as master may have moved on since it was cut
  const local = new Set(git('rev-list', `${from}..HEAD`).split('\n').filter(Boolean));
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'polar-release',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const all = [];
  for (let page = 1; ; page++) {
    const url =
      `${API_URL}/repos/${REPO}/compare/${from}...${DEFAULT_BRANCH}` +
      `?per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(
        `GitHub returned ${res.status} for ${url}. Check your connection, or set ` +
          `GITHUB_TOKEN if you hit the rate limit.`,
      );
    }
    const { commits, total_commits: total } = await res.json();
    all.push(...commits);
    if (!commits.length || all.length >= total) break;
  }

  // a co-author's personal email may also be on a commit they authored, next to their handle
  const handles = new Map(
    all
      .filter(({ author }) => author)
      .map(({ author, commit }) => [commit.author.email.toLowerCase(), author.login]),
  );
  const names = new Set();
  for (const { sha, author, commit, parents } of all) {
    if (!local.has(sha) || parents.length > 1) continue;
    const isBot = author && (author.type === 'Bot' || AUTOMATED_NAME.test(author.login));
    if (!isBot) names.add(author ? `@${author.login}` : commit.author.name);
    // a person can push to a bot's PR, so co-authors count even when the author doesn't
    coAuthors(commit.message, handles).forEach(name => names.add(name));
  }
  return [...names];
};

// finds the section of the version being released, which `yarn release` put at the top
const findSection = (lines, version) => {
  const start = lines.findIndex(l => VERSION_HEADING.test(l));
  const found = start === -1 ? null : VERSION_HEADING.exec(lines[start])[1];
  if (found !== version) {
    throw new Error(
      `${CHANGELOG} starts with version ${found}, but package.json is at ${version}. ` +
        `Run yarn release first.`,
    );
  }
  const next = lines.findIndex((l, i) => i > start && VERSION_HEADING.test(l));
  return { start, end: next === -1 ? lines.length : next };
};

// splits a changelog section into the text above its first heading and its ### sections
const parseSection = lines => {
  const preamble = [];
  const sections = new Map();
  let current = preamble;
  for (const line of lines) {
    if (line.startsWith('### ')) {
      current = [];
      sections.set(line.slice(4).trim(), current);
    } else {
      current.push(line);
    }
  }
  return { preamble, sections };
};

const clean = lines => lines.join('\n').trim();

const uniqueNames = names => {
  const unique = new Map(names.map(name => [name.toLowerCase(), name]));
  const key = name => name.replace(/^@/, '').toLowerCase();
  return [...unique.values()].sort((a, b) => key(a).localeCompare(key(b)));
};

const main = async () => {
  const { version } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const headings = parseHeadings(fs.readFileSync(TEMPLATE, 'utf8'));
  const lines = fs.readFileSync(CHANGELOG, 'utf8').replace(/\r\n/g, '\n').split('\n');
  // a tag means this version has shipped, and its section must not be rewritten
  if (git('tag', '--list', `v${version}`, version).trim()) {
    throw new Error(`Version ${version} is already released. Run yarn release first.`);
  }
  const { start, end } = findSection(lines, version);
  const fragments = readFragments(headings);
  const from = argValue('from') || previousTag();
  const contributors = await fetchContributors(from);

  const { preamble, sections } = parseSection(lines.slice(start + 1, end));

  // fragments replace the generated list, apart from Docs which doesn't need fragments
  let removed = 0;
  for (const [title, body] of sections) {
    if (title === DOCS) continue;
    const kept = body.filter(l => !GENERATED_COMMIT.test(l));
    removed += body.length - kept.length;
    sections.set(title, kept);
  }

  for (const fragment of fragments) {
    for (const { heading, body } of fragment.sections) {
      const title = heading.slice(2);
      if (!sections.has(title)) sections.set(title, []);
      const existing = sections.get(title);
      // nothing to add if this exact entry was folded before
      if (!clean(existing).includes(body)) {
        sections.set(title, [...clean(existing).split('\n'), ...body.split('\n')]);
      }
    }
  }

  // names already listed are kept, so someone added by hand stays on a later fold
  const listed = (sections.get(CONTRIBUTORS) || [])
    .map(l => /^[-*]\s+(.+?)\s*$/.exec(l))
    .filter(Boolean)
    .map(m => m[1]);
  sections.delete(CONTRIBUTORS);

  // keeps the changelog's usual order. Anything else, like breaking changes, goes first
  const known = headings.map(h => h.slice(2));
  const titles = [
    ...[...sections.keys()].filter(t => !known.includes(t)),
    ...known.filter(t => sections.has(t)),
  ];
  const parts = [lines[start]];
  if (clean(preamble)) parts.push(clean(preamble));
  for (const title of titles) {
    const body = clean(sections.get(title));
    if (body) parts.push(`### ${title}\n\n${body}`);
  }
  const names = uniqueNames([...listed, ...contributors]);
  if (names.length) {
    parts.push(`### ${CONTRIBUTORS}\n\n${names.map(n => `- ${n}`).join('\n')}`);
  }

  const before = lines.slice(0, start).join('\n');
  const after = lines.slice(end).join('\n');
  const next = [before.trimEnd(), parts.join('\n\n'), after].filter(Boolean).join('\n\n');
  fs.writeFileSync(CHANGELOG, next.endsWith('\n') ? next : `${next}\n`);
  fragments.forEach(({ file }) => fs.unlinkSync(path.normalize(file)));

  console.log(
    `Folded ${fragments.length} fragment(s) into ${version}, replaced ${removed} generated ` +
      `line(s) and listed ${names.length} contributor(s) since ${from}.\n` +
      `Review ${CHANGELOG} and add a summary at the top.`,
  );
};

main().catch(error => {
  console.error(`Nothing was changed. ${error.message}`);
  process.exit(1);
});
