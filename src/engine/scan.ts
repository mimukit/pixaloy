/**
 * The page scan: walk the page's elements in idle chunks and count colours
 * and fonts. `createPageCollector` is pure over injected functions, so unit
 * tests feed it fake elements; `scanPage` wires it to the live DOM.
 *
 * An element counts when it is visible and is not Pixaloy's own node.
 * Visible means `checkVisibility` with `visibilityProperty` and
 * `opacityProperty`: it skips an element under `display: none`, with
 * `visibility: hidden`, or with `opacity: 0` on itself or an ancestor. An
 * `opacity: 0` element paints nothing, so its colours are not on the page.
 */
import type { StyleSource } from './baseline';
import { FontCounter, hasDirectText, type FontEntry, type TextParent } from './fonts';
import { isPixaloyNode } from './guard';
import { PaletteCounter, type PaletteEntry, type PaletteTag } from './palette';
import { idleSchedule, runChunked, type Schedule } from './scheduler';

export interface PageScanResult {
  colours: PaletteEntry[];
  fonts: FontEntry[];
  /** Visible elements that counted. */
  elements: number;
}

export interface CollectorOptions<E> {
  getStyle: (element: E) => StyleSource;
  isVisible: (element: E) => boolean;
  /** Pixaloy's own nodes: the host and the baseline iframe. */
  isOwnNode: (element: E) => boolean;
}

export interface PageCollector<E> {
  visit: (element: E) => void;
  result: () => PageScanResult;
}

/** Counts colours and fonts one element at a time. */
export function createPageCollector<E extends PaletteTag & TextParent>({
  getStyle,
  isVisible,
  isOwnNode,
}: CollectorOptions<E>): PageCollector<E> {
  const palette = new PaletteCounter();
  const fonts = new FontCounter();
  let elements = 0;
  return {
    visit(element) {
      if (isOwnNode(element) || !isVisible(element)) return;
      elements += 1;
      const style = getStyle(element);
      palette.add(style, element);
      if (hasDirectText(element)) fonts.add(style);
    },
    result: () => ({ colours: palette.entries(), fonts: fonts.entries(), elements }),
  };
}

/** Whether a live element renders: see the module comment. */
export function isElementVisible(element: Element): boolean {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  }
  if (element.getClientRects().length === 0) return false;
  const style = (element.ownerDocument.defaultView ?? window).getComputedStyle(element);
  return style.visibility !== 'hidden' && style.opacity !== '0';
}

export interface ScanProgress {
  done: number;
  total: number;
}

export interface PageScanOptions {
  schedule?: Schedule;
  onProgress?: (progress: ScanProgress) => void;
}

export interface PageScan {
  /** The result, or null when cancelled. */
  done: Promise<PageScanResult | null>;
  cancel: () => void;
}

/**
 * Scan `document` in idle chunks. Elements in the page's own shadow roots and
 * iframes are out of scope for the MVP.
 */
export function scanPage(document: Document, options: PageScanOptions = {}): PageScan {
  const view = document.defaultView ?? window;
  const elements = document.querySelectorAll('*');
  const collector = createPageCollector<Element>({
    getStyle: (element) => view.getComputedStyle(element),
    isVisible: isElementVisible,
    isOwnNode: isPixaloyNode,
  });
  const task = runChunked(elements, collector.visit, {
    schedule: options.schedule ?? idleSchedule(view as never),
    total: elements.length,
    onProgress: (done) => options.onProgress?.({ done, total: elements.length }),
  });
  return {
    done: task.done.then((complete) => (complete ? collector.result() : null)),
    cancel: task.cancel,
  };
}
