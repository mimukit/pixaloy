import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

/**
 * Host access for the E2E build only (`wxt build --mode e2e`, written to
 * `.output/chrome-mv3-e2e`). In production, `activeTab` grants access on a real
 * toolbar click; Playwright cannot click the toolbar, so the E2E build may
 * script the local fixture server instead. The production manifest never has
 * host permissions, and `tests/unit/manifest.test.ts` asserts that.
 */
const E2E_HOST_PERMISSIONS = ['http://127.0.0.1/*'];

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ mode }) => ({
    name: 'Pixaloy',
    description:
      "Inspect CSS on any page, copy an element's minimized styles, and list page colours and fonts. Free, open source, fully local.",
    // Exactly these three. They show no install warning. Do not add host permissions.
    permissions: ['activeTab', 'scripting', 'storage'],
    // An action with no default_popup, so a toolbar click fires chrome.action.onClicked.
    action: {
      default_title: 'Pixaloy: inspect this page',
      // WXT lists public/icon/<size>.png under `icons` on its own; the toolbar sizes go here.
      // `pnpm icons` renders them from assets/icon.svg.
      default_icon: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
    },
    ...(mode === 'e2e' ? { host_permissions: E2E_HOST_PERMISSIONS } : {}),
  }),
});
