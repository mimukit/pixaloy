import { expect, test } from './fixtures';

test('the built extension loads and its service worker registers', async ({
  serviceWorker,
  extensionId,
}) => {
  expect(extensionId).toMatch(/^[a-p]{32}$/);
  expect(serviceWorker.url()).toBe(`chrome-extension://${extensionId}/background.js`);

  // Read the manifest through the `chrome` global of the running service worker.
  const manifest = await serviceWorker.evaluate(() =>
    (globalThis as unknown as { chrome: typeof browser }).chrome.runtime.getManifest(),
  );
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions?.sort()).toEqual(['activeTab', 'scripting', 'storage']);
});
