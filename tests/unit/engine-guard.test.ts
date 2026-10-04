import { describe, expect, it } from 'vitest';
import {
  BASELINE_FRAME_ATTRIBUTE,
  extractStyles,
  isPixaloyNode,
  type BaselineProvider,
} from '../../src/engine';
import { HOST_TAG } from '../../src/shared/constants';

interface FakeElement {
  localName: string;
  namespaceURI: string;
  attributes: string[];
  root: unknown;
  frameElement?: unknown;
  hasAttribute(name: string): boolean;
  getRootNode(): unknown;
  ownerDocument: { defaultView: { frameElement: unknown } | null };
}

const PAGE_DOCUMENT = { nodeType: 9 };

/** A duck-typed element: Vitest runs in Node, with no DOM. */
function fake(
  localName: string,
  {
    root = PAGE_DOCUMENT as unknown,
    attributes = [] as string[],
    frameElement = null as unknown,
  } = {},
): FakeElement {
  return {
    localName,
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    attributes,
    root,
    hasAttribute: (name) => attributes.includes(name),
    getRootNode: () => root,
    ownerDocument: { defaultView: { frameElement } },
  };
}

const host = fake(HOST_TAG);
const shadowRoot = { host };
const panelButton = fake('button', { root: shadowRoot });
const baselineFrame = fake('iframe', { root: shadowRoot, attributes: [BASELINE_FRAME_ATTRIBUTE] });
const baselineDiv = fake('div', { frameElement: baselineFrame });
const pageDiv = fake('div');
const pageWidget = fake('span', { root: { host: fake('my-widget') } });

describe('isPixaloyNode', () => {
  it.each([
    ['the inspector host', host],
    ['an element in its shadow root', panelButton],
    ['the baseline iframe', baselineFrame],
    ['an element inside the baseline iframe', baselineDiv],
  ])('is true for %s', (_name, element) => {
    expect(isPixaloyNode(element)).toBe(true);
  });

  it.each([
    ['a page element', pageDiv],
    ["an element in a page component's shadow root", pageWidget],
  ])('is false for %s', (_name, element) => {
    expect(isPixaloyNode(element)).toBe(false);
  });
});

describe('extractStyles', () => {
  const baseline: BaselineProvider & { calls: string[] } = {
    calls: [],
    styleFor(tag) {
      this.calls.push(tag.localName);
      return { display: 'block', 'box-sizing': 'content-box' };
    },
  };
  const getStyle = () => ({
    getPropertyValue: (property: string) =>
      ({ display: 'block', 'box-sizing': 'border-box' })[property] ?? '',
  });

  it('skips the host, the baseline iframe and its document without reading them', () => {
    baseline.calls = [];
    for (const element of [host, panelButton, baselineFrame, baselineDiv]) {
      expect(extractStyles(element as unknown as Element, { baseline, getStyle })).toBeNull();
    }
    expect(baseline.calls).toEqual([]);
  });

  it('diffs a page element against the same-tag baseline', () => {
    baseline.calls = [];
    const report = extractStyles(pageDiv as unknown as Element, { baseline, getStyle });
    expect(report?.css).toBe('box-sizing: border-box;');
    expect(baseline.calls).toEqual(['div']);
  });
});
