import { ARROW_DIRECTIONS, move } from './navigation';
import type { InspectorStore } from './store';
import { keepOnTop } from './top-layer';

interface ControllerOptions {
  host: HTMLElement;
  store: InspectorStore;
  /** Exit the inspector and remove everything. */
  exit: () => void;
  /** Aborts every listener the controller adds. */
  signal: AbortSignal;
}

/** Pointer events the page must not receive while the inspector runs. */
const BLOCKED_POINTER_EVENTS = [
  'pointerdown',
  'pointerup',
  'mousedown',
  'mouseup',
  'click',
  'dblclick',
  'auxclick',
  'contextmenu',
] as const;

/**
 * Wire the page events to the store: hover, click to pin, arrow keys to move,
 * Esc to unpin and then exit. All listeners use `signal`, so one abort
 * removes them all.
 */
export function attachController({ host, store, exit, signal }: ControllerOptions): void {
  const isOwn = (element: Element) => element === host || host.contains(element);
  const fromOwnUi = (event: Event) => event.composedPath().includes(host);
  const capture = { capture: true, signal } as const;

  /** The topmost page element at a point, ignoring the inspector host. */
  const hitTest = (x: number, y: number): Element | null =>
    document.elementsFromPoint(x, y).find((element) => !isOwn(element)) ?? null;

  let pointer: { x: number; y: number } | null = null;
  let hoverFrame = 0;
  window.addEventListener(
    'pointermove',
    (event) => {
      // Over the panel: keep the current outline.
      if (fromOwnUi(event)) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (hoverFrame) return;
      hoverFrame = requestAnimationFrame(() => {
        hoverFrame = 0;
        if (!pointer || store.getState().pinned) return;
        store.getState().hover(hitTest(pointer.x, pointer.y));
      });
    },
    { ...capture, passive: true },
  );
  signal.addEventListener('abort', () => cancelAnimationFrame(hoverFrame), { once: true });

  // The pointer left the window: drop the hover outline.
  window.addEventListener(
    'pointerout',
    (event) => {
      if (event.relatedTarget === null && !store.getState().pinned) store.getState().hover(null);
    },
    capture,
  );

  const block = (event: Event) => {
    if (fromOwnUi(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type !== 'click') return;
    const { clientX, clientY } = event as MouseEvent;
    const target = hitTest(clientX, clientY);
    if (target) store.getState().pin(target);
  };
  for (const type of BLOCKED_POINTER_EVENTS) window.addEventListener(type, block, capture);

  window.addEventListener(
    'keydown',
    (event) => {
      const state = store.getState();
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (state.pinned) state.unpin();
        else exit();
        return;
      }
      const direction = ARROW_DIRECTIONS[event.key];
      if (!direction || !state.pinned) return;
      // Arrow keys in the panel's text box (the copy fallback) move the caret.
      const origin = event.composedPath()[0];
      if (origin instanceof HTMLTextAreaElement || origin instanceof HTMLInputElement) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const next = move(state.pinned, direction, isOwn);
      if (!next) return;
      state.pin(next);
      next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    },
    capture,
  );

  let layoutFrame = 0;
  const bumpLayout = () => {
    if (layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      store.getState().bumpLayout();
    });
  };
  document.addEventListener('scroll', bumpLayout, { ...capture, passive: true });
  window.addEventListener('resize', bumpLayout, { signal });
  signal.addEventListener('abort', () => cancelAnimationFrame(layoutFrame), { once: true });

  keepOnTop(host, signal);
}
