(() => {
  const id = 'pr-slack-copy-button';
  let scheduled = false;
  let resetTimer;

  function update() {
    scheduled = false;
    const pr = PRSlack.read();
    const existing = document.getElementById(id);
    if (!pr) {
      existing?.remove();
      return;
    }
    const heading = document.querySelector('h1:has(.markdown-title), h1:has(.js-issue-title), h1:has([data-testid="issue-title"]), .gh-header-title');
    if (!heading || existing) return;
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.textContent = 'Copy for Slack';
    button.title = 'Copy this PR with its title, number, and link';
    button.setAttribute('aria-live', 'polite');
    button.addEventListener('click', async () => {
      const current = PRSlack.read();
      if (!current) return;
      clearTimeout(resetTimer);
      button.disabled = true;
      try {
        await PRSlack.copy(current);
        button.textContent = 'Copied!';
      } catch {
        button.textContent = 'Use the extension icon to copy';
        PRSlack.notify('Could not copy. Try the extension icon.', true);
      } finally {
        button.disabled = false;
        resetTimer = setTimeout(() => { button.textContent = 'Copy for Slack'; }, 2500);
      }
    });
    const suffix = heading.parentElement.querySelector('[class*="titleSuffix"]');
    (suffix || heading).append(button);
  }

  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  document.addEventListener('turbo:load', update);
  window.addEventListener('popstate', update);
  update();
})();
