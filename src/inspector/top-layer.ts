/**
 * Keep the inspector host on top of the page's own top-layer elements.
 *
 * The host is a `popover="manual"` element. The top layer stacks in the order
 * elements enter it, so when the page opens a modal dialog, a popover or a
 * fullscreen element after the inspector, the host goes below it. Each time
 * that happens, the host is hidden and shown again to move it back on top.
 *
 * Signals, all cheap and event-driven:
 * - `beforetoggle` / `toggle` (capture) for popovers and dialogs,
 * - a MutationObserver on the `open` attribute, for `dialog.show()` and
 *   `showModal()`,
 * - `fullscreenchange`.
 */
export function keepOnTop(host: HTMLElement, signal: AbortSignal): void {
  let queued = false;

  const raise = () => {
    queued = false;
    if (signal.aborted || !host.isConnected) return;
    if (host.matches(':popover-open')) host.hidePopover();
    host.showPopover();
  };

  // Run after the page's own call returns, when its element is in the top layer.
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(raise);
  };

  const onToggle = (event: Event) => {
    if (event.target === host) return;
    if ((event as ToggleEvent).newState === 'open') schedule();
  };

  document.addEventListener('beforetoggle', onToggle, { capture: true, signal });
  document.addEventListener('toggle', onToggle, { capture: true, signal });
  document.addEventListener('fullscreenchange', schedule, { capture: true, signal });

  const observer = new MutationObserver((records) => {
    const opened = records.some(
      (record) => record.target !== host && (record.target as Element).hasAttribute('open'),
    );
    if (opened) schedule();
  });
  observer.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: ['open'],
  });
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
}
