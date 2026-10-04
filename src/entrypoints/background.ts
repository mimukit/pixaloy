import { handleActionClick } from '../background/action';

// Service worker. A toolbar click toggles the inspector on the clicked tab.
export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    void handleActionClick(tab);
  });

  // E2E builds only (`wxt build --mode e2e`). Playwright cannot click the toolbar,
  // so tests call the same handler through the service worker. Production builds
  // drop this branch at build time.
  if (import.meta.env.MODE === 'e2e') {
    Object.assign(globalThis, { __pixaloyE2E: { handleActionClick } });
  }
});
