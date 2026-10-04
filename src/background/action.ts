import { browser, type Browser } from 'wxt/browser';
import { ACTIVE_KEY, BADGE_CLEAR_MS, INSPECTOR_SCRIPT } from '../shared/constants';

export type ToggleResult = 'injected' | 'removed' | 'failed';

const clearTimers = new Map<number, ReturnType<typeof setTimeout>>();

/**
 * Handle a toolbar action click on `tab`: remove the inspector when it is
 * active, inject it otherwise. A failed injection (a restricted page) shows a
 * `!` badge and the reason in the action title for 3 s.
 */
export async function handleActionClick(tab: Browser.tabs.Tab): Promise<ToggleResult> {
  const tabId = tab.id;
  if (tabId === undefined) return 'failed';
  try {
    if (await removeIfActive(tabId)) return 'removed';
    await browser.scripting.executeScript({ target: { tabId }, files: [INSPECTOR_SCRIPT] });
    return 'injected';
  } catch (error) {
    await showRestrictedBadge(tabId, errorReason(error));
    return 'failed';
  }
}

/** Tear down a running inspector in the tab. Resolves `true` when one was running. */
async function removeIfActive(tabId: number): Promise<boolean> {
  const [probe] = await browser.scripting.executeScript({
    target: { tabId },
    args: [ACTIVE_KEY],
    // Runs in the extension's isolated world, where the content script keeps its handle.
    func: (key: string) => {
      const active = (globalThis as Record<string, unknown>)[key] as
        { teardown: () => void } | undefined;
      if (!active) return false;
      active.teardown();
      return true;
    },
  });
  return probe?.result === true;
}

/** Set the `!` badge and the reason on one tab, and clear both after 3 s. */
export async function showRestrictedBadge(tabId: number, reason: string): Promise<void> {
  const previous = clearTimers.get(tabId);
  if (previous !== undefined) clearTimeout(previous);

  await Promise.all([
    browser.action.setBadgeText({ tabId, text: '!' }),
    browser.action.setBadgeBackgroundColor({ tabId, color: '#d93025' }),
    browser.action.setTitle({ tabId, title: `Pixaloy cannot inspect this page: ${reason}` }),
  ]);

  clearTimers.set(
    tabId,
    setTimeout(() => {
      clearTimers.delete(tabId);
      void clearBadge(tabId);
    }, BADGE_CLEAR_MS),
  );
}

async function clearBadge(tabId: number): Promise<void> {
  try {
    await Promise.all([
      browser.action.setBadgeText({ tabId, text: '' }),
      browser.action.setTitle({ tabId, title: defaultTitle() }),
    ]);
  } catch {
    // The tab closed before the badge cleared. Nothing to clear.
  }
}

function defaultTitle(): string {
  return browser.runtime.getManifest().action?.default_title ?? 'Pixaloy';
}

export function errorReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim() || 'the browser blocks extensions on this page.';
}
