/*
 * Fragment rules shared by check-release-notes.js and fold-release-notes.js, so a fragment
 * that passes the check on its PR can always be folded at release time.
 */
const NOTES_DIR = 'docs/release-notes';
const UNRELEASED_DIR = `${NOTES_DIR}/unreleased`;
const TEMPLATE = `${NOTES_DIR}/template.md`;
// explains the directory to people browsing it on GitHub. It is not a fragment
const UNRELEASED_README = `${UNRELEASED_DIR}/README.md`;

const isFragmentPath = file =>
  file.startsWith(`${UNRELEASED_DIR}/`) && file !== UNRELEASED_README;

const isFragmentName = name => /^\d+\.md$/.test(name);

// the headings allowed in a fragment come from the template, so there is one source of truth
const parseHeadings = template =>
  template
    .split('\n')
    .filter(l => /^# /.test(l))
    .map(l => l.trim());

// splits a fragment into its headings and the entries under each one
const parseFragment = source => {
  // comments don't reach the changelog, so they don't count as content
  const text = source
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  const sections = text
    .split(/^(?=# )/m)
    .filter(s => s.startsWith('# '))
    .map(section => {
      const [heading, ...lines] = section.split('\n').map(l => l.trimEnd());
      return { heading: heading.trim(), body: lines.join('\n').trim() };
    });
  return { text, sections };
};

const fragmentProblems = (source, headings) => {
  const { text, sections } = parseFragment(source);
  const problems = [];
  if (!text.startsWith('# ')) {
    problems.push('must start with a top-level heading (# ...)');
  }
  for (const { heading, body } of sections) {
    if (!headings.includes(heading)) {
      problems.push(`unknown heading "${heading}". Use one of: ${headings.join(', ')}`);
    }
    if (!body.split('\n').some(l => l.trim() !== '' && !l.trim().startsWith('#'))) {
      problems.push(`add an entry under "${heading}", or remove the heading`);
    }
  }
  return problems;
};

module.exports = {
  UNRELEASED_DIR,
  TEMPLATE,
  UNRELEASED_README,
  isFragmentPath,
  isFragmentName,
  parseHeadings,
  parseFragment,
  fragmentProblems,
};
