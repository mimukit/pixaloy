/**
 * A fixture page as a table: Vitest runs in Node with no DOM, so each element
 * carries its computed style as a plain map, the way Chrome serializes it.
 * Every element starts from the defaults below, as on a real page: `fill` is
 * black on every element, and the outline width is 3px with style `none`.
 */
import { HOST_TAG } from '../../../src/shared/constants';

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

export interface FakeElement {
  id: string;
  localName: string;
  namespaceURI: string;
  parent: FakeElement | null;
  style: Record<string, string>;
  childNodes: Array<{ nodeType: number; nodeValue: string | null }>;
  hasAttribute(name: string): boolean;
  getRootNode(): unknown;
  ownerDocument: { defaultView: { frameElement: unknown } };
}

const DEFAULTS: Record<string, string> = {
  color: 'rgb(0, 0, 0)',
  'background-color': 'rgba(0, 0, 0, 0)',
  'border-top-width': '0px',
  'border-right-width': '0px',
  'border-bottom-width': '0px',
  'border-left-width': '0px',
  'border-top-color': 'rgb(0, 0, 255)',
  'border-right-color': 'rgb(0, 0, 255)',
  'border-bottom-color': 'rgb(0, 0, 255)',
  'border-left-color': 'rgb(0, 0, 255)',
  'outline-style': 'none',
  'outline-width': '3px',
  'outline-color': 'rgb(0, 255, 0)',
  fill: 'rgb(0, 0, 0)',
  stroke: 'none',
  'font-family': 'Times New Roman',
  'font-size': '16px',
  'font-weight': '400',
  'line-height': 'normal',
  display: 'block',
  visibility: 'visible',
  opacity: '1',
};

const DOCUMENT = { nodeType: 9 };

interface Spec {
  id: string;
  tag: string;
  svg?: boolean;
  parent?: string;
  text?: string;
  style?: Record<string, string>;
}

const INK = 'rgb(17, 17, 17)';
const BLUE = 'rgb(0, 102, 204)';
const RED = 'rgb(255, 0, 0)';
const INTER = 'Inter, sans-serif';

const SPECS: Spec[] = [
  { id: 'html', tag: 'html' },
  {
    id: 'body',
    tag: 'body',
    parent: 'html',
    text: '\n  ',
    style: { color: INK, 'background-color': 'rgb(255, 255, 255)', 'font-family': INTER },
  },
  {
    id: 'h1',
    tag: 'h1',
    parent: 'body',
    text: 'Title',
    style: { color: INK, 'font-family': 'Georgia, serif' },
  },
  {
    id: 'p',
    tag: 'p',
    parent: 'body',
    text: 'Body copy',
    // Only the top border has a width; the other three colours must not count.
    style: { color: INK, 'font-family': INTER, 'border-top-width': '1px', 'border-top-color': RED },
  },
  {
    id: 'note',
    tag: 'p',
    parent: 'body',
    text: 'Note',
    style: { color: 'rgba(17, 17, 17, 0.5)', 'font-family': INTER },
  },
  {
    id: 'button',
    tag: 'button',
    parent: 'body',
    text: 'Go',
    style: {
      color: 'rgb(255, 255, 255)',
      'background-color': BLUE,
      'border-top-width': '2px',
      'border-right-width': '2px',
      'border-bottom-width': '2px',
      'border-left-width': '2px',
      'border-top-color': BLUE,
      'border-right-color': BLUE,
      'border-bottom-color': BLUE,
      'border-left-color': BLUE,
      'outline-style': 'solid',
      'outline-width': '2px',
      'outline-color': RED,
      'font-family': 'system-ui',
    },
  },
  // A transparent background with a colour keyword: must not count.
  {
    id: 'link',
    tag: 'a',
    parent: 'body',
    text: 'Link',
    style: { color: BLUE, 'background-color': 'transparent', 'font-family': INTER },
  },
  // display: none: the element and its child must not count.
  {
    id: 'hidden',
    tag: 'div',
    parent: 'body',
    style: { display: 'none', color: 'rgb(1, 2, 3)', 'background-color': 'rgb(4, 5, 6)' },
  },
  {
    id: 'hidden-child',
    tag: 'span',
    parent: 'hidden',
    text: 'Secret',
    style: { color: 'rgb(1, 2, 3)', 'font-family': 'Comic Sans MS' },
  },
  // visibility: hidden: must not count.
  {
    id: 'invisible',
    tag: 'span',
    parent: 'body',
    text: 'Ghost',
    style: { visibility: 'hidden', color: 'rgb(7, 8, 9)', 'font-family': 'Papyrus' },
  },
  // opacity: 0: must not count.
  {
    id: 'faded',
    tag: 'div',
    parent: 'body',
    text: 'Faded',
    style: { opacity: '0', color: 'rgb(10, 11, 12)', 'font-family': 'Impact' },
  },
  // Only whitespace text: counts its colour, not its font.
  {
    id: 'spacer',
    tag: 'div',
    parent: 'body',
    text: '   ',
    style: { color: INK, 'font-family': 'monospace' },
  },
  // The SVG container paints nothing: its black fill must not count.
  { id: 'svg', tag: 'svg', svg: true, parent: 'body', style: { color: INK } },
  {
    id: 'path',
    tag: 'path',
    svg: true,
    parent: 'svg',
    style: { color: INK, fill: RED, stroke: 'none' },
  },
  {
    id: 'circle',
    tag: 'circle',
    svg: true,
    parent: 'svg',
    style: { color: INK, fill: 'none', stroke: 'rgba(0, 102, 204, 0.25)' },
  },
  // Pixaloy's own host: must not count.
  {
    id: 'host',
    tag: HOST_TAG,
    parent: 'html',
    text: 'Pixaloy',
    style: { color: 'rgb(9, 9, 9)', 'font-family': 'Pixaloy' },
  },
];

export function buildFixturePage(): FakeElement[] {
  const byId = new Map<string, FakeElement>();
  return SPECS.map((spec) => {
    const element: FakeElement = {
      id: spec.id,
      localName: spec.tag,
      namespaceURI: spec.svg ? SVG_NS : HTML_NS,
      parent: spec.parent ? byId.get(spec.parent)! : null,
      style: { ...DEFAULTS, ...spec.style },
      childNodes: spec.text === undefined ? [] : [{ nodeType: 3, nodeValue: spec.text }],
      hasAttribute: () => false,
      getRootNode: () => DOCUMENT,
      ownerDocument: { defaultView: { frameElement: null } },
    };
    byId.set(spec.id, element);
    return element;
  });
}

export function fakeStyle(element: FakeElement) {
  return { getPropertyValue: (property: string) => element.style[property] ?? '' };
}

/** What `checkVisibility({ visibilityProperty, opacityProperty })` answers. */
export function fakeVisible(element: FakeElement): boolean {
  if (element.style.visibility === 'hidden') return false;
  for (let node: FakeElement | null = element; node; node = node.parent) {
    if (node.style.display === 'none' || node.style.opacity === '0') return false;
  }
  return true;
}

/** The exact counts the fixture page must give. */
export const EXPECTED_COLOURS: Record<string, number> = {
  // body, h1, p, spacer, svg, path, circle
  'rgba(17, 17, 17, 1)': 7,
  // button background, its four borders, the link
  'rgba(0, 102, 204, 1)': 6,
  // p top border, button outline, path fill
  'rgba(255, 0, 0, 1)': 3,
  // body background, button text
  'rgba(255, 255, 255, 1)': 2,
  // html
  'rgba(0, 0, 0, 1)': 1,
  'rgba(17, 17, 17, 0.5)': 1,
  // circle stroke
  'rgba(0, 102, 204, 0.25)': 1,
};

export const EXPECTED_FONTS: Record<string, number> = {
  'Inter, sans-serif': 3,
  'Georgia, serif': 1,
  'system-ui': 1,
};
