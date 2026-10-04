import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  test as base,
  chromium,
  type BrowserContext,
  type Page,
  type Worker,
} from '@playwright/test';

// The E2E build (`wxt build --mode e2e`): production code plus host access to
// the local fixture server, because Playwright cannot grant activeTab.
export const extensionPath = resolve(import.meta.dirname, '../../.output/chrome-mv3-e2e');

interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
  serviceWorker: Worker;
}

/**
 * Launches Chromium with the built extension loaded.
 *
 * Extensions load in headless mode only with the full Chromium build
 * (`channel: 'chromium'`), not with the headless shell.
 */
export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright needs the destructuring pattern.
  context: async ({}, use) => {
    const userDataDir = mkdtempSync(join(tmpdir(), 'pixaloy-e2e-'));
    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },
  serviceWorker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await use(worker);
  },
  extensionId: async ({ serviceWorker }, use) => {
    const extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },
});

export const expect = test.expect;

type ExtensionGlobal = {
  chrome: typeof browser;
  __pixaloyE2E: { handleActionClick: (tab: unknown) => Promise<string> };
};

/**
 * Act as a toolbar click on `page`: call the service worker's real
 * `action.onClicked` handler with the active tab. Playwright cannot click the
 * toolbar, so the E2E build exposes the handler as `__pixaloyE2E`.
 * Resolves to `injected`, `removed` or `failed`.
 */
export async function clickAction(serviceWorker: Worker, page: Page): Promise<string> {
  await page.bringToFront();
  return serviceWorker.evaluate(async () => {
    const scope = globalThis as unknown as ExtensionGlobal;
    const [tab] = await scope.chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return scope.__pixaloyE2E.handleActionClick(tab);
  });
}

/** Read the action badge text and title of the active tab. */
export async function readActionState(
  serviceWorker: Worker,
): Promise<{ text: string; title: string }> {
  return serviceWorker.evaluate(async () => {
    const { chrome } = globalThis as unknown as ExtensionGlobal;
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tabId = tab?.id;
    return {
      text: await chrome.action.getBadgeText({ tabId }),
      title: await chrome.action.getTitle({ tabId }),
    };
  });
}
