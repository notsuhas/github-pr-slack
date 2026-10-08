globalThis.PRSlack = (() => {
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function format(url, title) {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/|$)/);
    if (parsed.origin !== 'https://github.com' || !match || !title.trim()) return null;
    const canonical = `${parsed.origin}/${match[1]}/${match[2]}/pull/${match[3]}`;
    const cleanTitle = title.trim().replace(/\s+/g, ' ');
    const number = `#${match[3]}`;
    const label = `${number} — ${cleanTitle}`;
    const slackTitle = cleanTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return {
      url: canonical,
      label,
      text: `<${canonical}|${number}> — ${slackTitle}`,
      html: `<a href="${escapeHtml(canonical)}">${number}</a> — ${escapeHtml(cleanTitle)}`
    };
  }

  function read() {
    const match = location.pathname.match(/^\/[^/]+\/[^/]+\/pull\/(\d+)(?:\/|$)/);
    if (!match) return null;
    const titleElement = document.querySelector('h1 .js-issue-title, h1 [data-testid="issue-title"], h1 .markdown-title, .gh-header-title .js-issue-title');
    const suffix = ` · Pull Request #${match[1]} · `;
    const title = titleElement?.textContent || (document.title.includes(suffix) ? document.title.split(suffix)[0].replace(/ by \S+$/, '') : '');
    return format(location.href, title);
  }

  async function copy(pr) {
    await navigator.clipboard.write([new ClipboardItem({
      'text/plain': new Blob([pr.text], { type: 'text/plain' }),
      'text/html': new Blob([pr.html], { type: 'text/html' })
    })]);
    notify('Copied for Slack');
  }

  function notify(message, isError = false) {
    document.getElementById('pr-slack-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'pr-slack-toast';
    toast.setAttribute('role', isError ? 'alert' : 'status');
    toast.textContent = `${isError ? '!' : '✓'}  ${message}`;
    Object.assign(toast.style, {
      all: 'initial', position: 'fixed', right: '24px', bottom: '24px',
      zIndex: '2147483647', padding: '12px 18px', borderRadius: '10px',
      background: isError ? 'rgba(164, 14, 38, 1)' : 'rgba(24, 92, 42, 1)',
      color: 'rgba(255, 255, 255, 1)',
      font: '500 14px/20px system-ui, sans-serif',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)', pointerEvents: 'none'
    });
    document.body.append(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  return { format, read, copy, notify };
})();
