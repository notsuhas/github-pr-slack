const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../github-pr-slack/pr.js');

test('copies title and number with a canonical PR link from any PR tab', () => {
  const result = PRSlack.format('https://github.com/owner/repo/pull/123/files?diff=split#diff-1', '  Fix login\nredirect  ');
  assert.equal(result.text, '<https://github.com/owner/repo/pull/123|#123> — Fix login redirect');
  assert.equal(result.html, '<a href="https://github.com/owner/repo/pull/123">#123</a> — Fix login redirect');
});

test('escapes titles so they cannot create HTML or break Slack link delimiters', () => {
  const result = PRSlack.format('https://github.com/a/b/pull/7', '<img src=x> & "hello" | test');
  assert.equal(result.text, '<https://github.com/a/b/pull/7|#7> — &lt;img src=x&gt; &amp; "hello" | test');
  assert.equal(result.html, '<a href="https://github.com/a/b/pull/7">#7</a> — &lt;img src=x&gt; &amp; &quot;hello&quot; | test');
});

test('rejects non-PR pages, lookalike domains, insecure links, and empty titles', () => {
  for (const url of ['https://github.com/a/b/issues/7', 'https://github.com/a/b/pull/7oops', 'https://github.com.evil.test/a/b/pull/7', 'http://github.com/a/b/pull/7']) {
    assert.equal(PRSlack.format(url, 'Title'), null);
  }
  assert.equal(PRSlack.format('https://github.com/a/b/pull/7', '  '), null);
});

test('reads PR subpages without copying GitHub author metadata into the title', () => {
  global.location = { pathname: '/a/b/pull/7/files', href: 'https://github.com/a/b/pull/7/files' };
  global.document = { querySelector: () => null, title: 'Fix login by alice · Pull Request #7 · a/b · GitHub' };
  assert.equal(PRSlack.read().label, '#7 — Fix login');
  document.title = 'A repository · GitHub';
  assert.equal(PRSlack.read(), null);
});
