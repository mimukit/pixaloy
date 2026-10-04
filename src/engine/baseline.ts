import type { StyleMap } from './diff';
import { ALL_PROPERTIES } from './properties';

/** The tag a baseline is for: the element's local name and namespace. */
export interface BaselineTag {
  localName: string;
  namespaceURI: string | null;
}

/**
 * Gives the UA default computed style of a tag. The engine depends only on
 * this interface, so unit tests can pass a plain map and v2 can add other
 * sources behind it.
 */
export interface BaselineProvider {
  styleFor(tag: BaselineTag): StyleMap;
}

/** The minimal `CSSStyleDeclaration` surface the engine reads. */
export interface StyleSource {
  getPropertyValue(property: string): string;
}

/** Read `properties` from a computed style into a plain map. */
export function readStyle(
  style: StyleSource,
  properties: readonly string[] = ALL_PROPERTIES,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const property of properties) map[property] = style.getPropertyValue(property);
  return map;
}

/** Marks the baseline iframe, so the engine and the scans can skip it. */
export const BASELINE_FRAME_ATTRIBUTE = 'data-pixaloy-baseline';

const HTML_NS = 'http://www.w3.org/1999/xhtml';

/**
 * A baseline from a hidden iframe that `createFrameBaseline` appends to
 * `parent` (the panel's shadow root) on first use.
 *
 * The iframe has no `src`. The engine writes `<!doctype html>` into it, so the
 * document is in standards mode, then creates one element per tag in its
 * body, reads its computed style and caches it per tag. `display: none` on the
 * iframe means no layout runs, so sizes read as their specified defaults
 * (`auto`) rather than the iframe's pixel size.
 */
export function createFrameBaseline(parent: Node & ParentNode): BaselineProvider & {
  dispose(): void;
} {
  const cache = new Map<string, StyleMap>();
  let frame: HTMLIFrameElement | null = null;

  const frameDocument = (): Document => {
    if (!frame?.isConnected || !frame.contentDocument) {
      frame?.remove();
      frame = parent.ownerDocument!.createElement('iframe');
      frame.setAttribute(BASELINE_FRAME_ATTRIBUTE, '');
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.setProperty('display', 'none', 'important');
      parent.append(frame);
      const doc = frame.contentDocument!;
      doc.open();
      doc.write('<!doctype html><html><head></head><body></body></html>');
      doc.close();
      cache.clear();
    }
    return frame.contentDocument!;
  };

  return {
    styleFor({ localName, namespaceURI }) {
      const key = `${namespaceURI ?? HTML_NS}|${localName}`;
      const cached = cache.get(key);
      if (cached) return cached;
      const doc = frameDocument();
      const element = doc.createElementNS(namespaceURI ?? HTML_NS, localName);
      doc.body.append(element);
      const style = readStyle(doc.defaultView!.getComputedStyle(element));
      element.remove();
      cache.set(key, style);
      return style;
    },
    dispose() {
      frame?.remove();
      frame = null;
      cache.clear();
    },
  };
}
