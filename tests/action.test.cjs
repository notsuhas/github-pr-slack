const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const folder = path.join(__dirname, '../github-pr-slack');

test('toolbar and shortcut share the copy action and report success or failure', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json')));
  assert.equal(manifest.action.default_popup, undefined);
  assert.equal(manifest.commands._execute_action.suggested_key.mac, 'Command+Shift+Y');
  let onClicked;
  let label;
  let badge;
  let title;
  let copyCalls = 0;
  const context = vm.createContext({
    PRSlack: { read: () => label ? { label } : null, copy: async () => { copyCalls++; } },
    chrome: {
      action: {
        onClicked: { addListener: fn => { onClicked = fn; } },
        setBadgeText: async data => { badge = data.text; },
        setBadgeBackgroundColor: async () => {},
        setTitle: async data => { title = data.title; }
      },
      scripting: { executeScript: async options => options.func ? [{ result: await options.func() }] : [] },
      tabs: { onUpdated: { addListener: () => {} } }
    }
  });
  vm.runInContext(fs.readFileSync(path.join(folder, 'background.js'), 'utf8'), context);
  label = '#7 — Fix login';
  await onClicked({ id: 1, url: 'https://github.com/a/b/pull/7' });
  assert.equal(copyCalls, 1);
  assert.equal(badge, '✓');
  assert.equal(title, 'Copied: #7 — Fix login');
  label = null;
  await onClicked({ id: 1, url: 'https://github.com/a/b' });
  assert.equal(copyCalls, 1);
  assert.equal(badge, '!');
  assert.match(title, /Open a GitHub pull request/);
  await onClicked({ id: 1, url: 'https://example.com' });
  assert.equal(copyCalls, 1);
});
