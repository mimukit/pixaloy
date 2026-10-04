import { createRoot, type Root } from 'react-dom/client';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { createFrameBaseline } from '../engine';
import { ACTIVE_KEY, HOST_TAG, type ActiveInspector } from '../shared/constants';
import { App } from '../ui/App';
import tailwindCss from '../ui/styles.css?inline';
import { attachController } from './controller';
import { captureDocumentListeners } from './listeners';
import { adoptPropertyRules, splitShadowCss } from './shadow-css';
import { createInspectorStore } from './store';

/**
 * Mount the inspector and wire its events. Exit (Esc with nothing pinned, the
 * close button, or a second toolbar click) aborts `ctx`, which removes the
 * host, every listener, the observer, and the React root.
 */
export async function startInspector(ctx: ContentScriptContext): Promise<void> {
  const { shadowCss, propertyCss } = splitShadowCss(tailwindCss);
  adoptPropertyRules(propertyCss);

  const store = createInspectorStore();
  const exit = () => ctx.abort('Pixaloy inspector exited');

  const ui = await createShadowRootUi<Root>(ctx, {
    name: HOST_TAG,
    position: 'inline',
    anchor: () => document.documentElement,
    append: 'last',
    css: shadowCss,
    // The :host rule in styles.css does the reset with !important.
    inheritStyles: true,
    onMount(container, shadow, host) {
      host.setAttribute('popover', 'manual');
      host.showPopover();
      // React adds a `selectionchange` listener to the document and never removes
      // it. Capture it so the teardown can remove it too.
      const { result: root, release } = captureDocumentListeners(() => createRoot(container));
      ctx.onInvalidated(release);
      // The style baseline iframe lives in the shadow root, so exit removes it with the host.
      const baseline = createFrameBaseline(shadow);
      root.render(<App store={store} baseline={baseline} onExit={exit} />);
      return root;
    },
    onRemove(root) {
      root?.unmount();
    },
  });
  if (ctx.isInvalid) return;
  ui.mount();

  attachController({ host: ui.shadowHost, store, exit, signal: ctx.signal });

  const scope = globalThis as Record<string, unknown>;
  const handle: ActiveInspector = { teardown: exit };
  scope[ACTIVE_KEY] = handle;
  ctx.onInvalidated(() => {
    if (scope[ACTIVE_KEY] === handle) delete scope[ACTIVE_KEY];
  });
}
