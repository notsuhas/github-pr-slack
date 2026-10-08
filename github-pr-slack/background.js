async function feedback(tabId, text, title, color) {
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text }),
    chrome.action.setBadgeBackgroundColor({ tabId, color }),
    chrome.action.setTitle({ tabId, title })
  ]);
}

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try {
    if (!tab.url?.startsWith('https://github.com/')) throw new Error('Open a GitHub pull request first.');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['pr.js'] });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const pr = globalThis.PRSlack.read();
        if (!pr) return null;
        try {
          await globalThis.PRSlack.copy(pr);
        } catch (error) {
          globalThis.PRSlack.notify('Could not copy. Please try again.', true);
          throw error;
        }
        return pr.label;
      }
    });
    if (!result.result) throw new Error('Open a GitHub pull request first.');
    await feedback(tab.id, '✓', `Copied: ${result.result}`, 'rgba(35, 134, 54, 1)');
  } catch (error) {
    await feedback(tab.id, '!', `Could not copy: ${error.message}`, 'rgba(207, 34, 46, 1)');
  }
});

chrome.tabs.onUpdated.addListener((tabId, change) => {
  if (change.url) {
    chrome.action.setBadgeText({ tabId, text: '' });
    chrome.action.setTitle({ tabId, title: 'Copy PR for Slack (⌘⇧Y)' });
  }
});
