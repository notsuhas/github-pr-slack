# GitHub PR → Slack

## Install in Chrome

1. Extract the ZIP if you downloaded it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `github-pr-slack` folder containing `manifest.json`.
4. Pin the extension's toolbar icon. Open a PR and click the icon to copy immediately, or press **⌘⇧Y** (Mac) / **Ctrl+Shift+Y** (Windows/Linux).
5. Paste into Slack normally with ⌘V / Ctrl+V to keep the link formatting.

The icon shows **✓** after copying or **!** on failure (hover for the error). A small toast confirms the copy on the page. Refresh GitHub after installing to also get a **Copy for Slack** button beside the PR number.

Dia uses the same Chromium extension install flow. The default shortcut leaves **⌘⇧C** alone. You can change the binding at `chrome://extensions/shortcuts` (or `dia://extensions/shortcuts` in Dia) if another extension or a custom browser shortcut already uses it.

Example: **#123** links to the PR, followed by the plain title: **— Fix login redirect**.

The clipboard contains an HTML link for rich-text paste, plus Slack markup as plain text:

```
<https://github.com/owner/repo/pull/123|#123> — Fix login redirect
```

Slack's plain-text / Markdown composer may keep the markup as literal text. Use its rich-text composer and normal paste for the clickable title.

Works on github.com PRs, including private repos you can access and PR subpages. Reads the current page; no GitHub token, account setup, network requests, or stored data. Permissions allow GitHub page access, reading the active tab when you click the icon or use the shortcut, and writing to the clipboard. It cannot read your clipboard.

This is an unpacked extension; keep the folder in place after installing it.

## Development

Requires Node.js 22+ and Python 3. No dependencies to install.

```sh
npm test
npm run package
```

The package command creates `dist/github-pr-slack-v1.1.0.zip`. After editing, reload the extension at `chrome://extensions` and refresh GitHub.
