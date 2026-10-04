import { startInspector } from '../inspector/mount';

/**
 * The inspector. Not listed in the manifest: the service worker injects it
 * with `scripting.executeScript` on a toolbar click (`registration: 'runtime'`
 * with no `matches`, so no host permission is added). The CSS is inlined into
 * the shadow root, so no CSS file is listed or made web-accessible.
 */
export default defineContentScript({
  matches: [],
  registration: 'runtime',
  cssInjectionMode: 'manual',
  noScriptStartedPostMessage: true,
  main: (ctx) => startInspector(ctx),
});
