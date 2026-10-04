import { describe, expect, it } from 'vitest';
import {
  colourValues,
  createPageCollector,
  fontMetrics,
  hasDirectText,
  isPixaloyNode,
} from '../../src/engine';
import {
  buildFixturePage,
  EXPECTED_COLOURS,
  EXPECTED_FONTS,
  fakeStyle,
  fakeVisible,
} from './fixtures/page';

function scanFixture() {
  const collector = createPageCollector({
    getStyle: fakeStyle,
    isVisible: fakeVisible,
    isOwnNode: isPixaloyNode,
  });
  for (const element of buildFixturePage()) collector.visit(element);
  return collector.result();
}

describe('page scan on the fixture page', () => {
  it('counts the colours exactly, most used first', () => {
    const { colours } = scanFixture();
    expect(Object.fromEntries(colours.map((entry) => [entry.key, entry.count]))).toEqual(
      EXPECTED_COLOURS,
    );
    const counts = colours.map((entry) => entry.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(colours[0]!.key).toBe('rgba(17, 17, 17, 1)');
  });

  it('skips transparent, hidden, unpainted and own-node colours', () => {
    const keys = scanFixture().colours.map((entry) => entry.key);
    for (const absent of [
      'rgba(0, 0, 0, 0)', // transparent backgrounds
      'rgba(1, 2, 3, 1)', // display: none and its child
      'rgba(4, 5, 6, 1)',
      'rgba(7, 8, 9, 1)', // visibility: hidden
      'rgba(10, 11, 12, 1)', // opacity: 0
      'rgba(0, 0, 255, 1)', // border sides with width 0
      'rgba(0, 255, 0, 1)', // outline with style none
      'rgba(9, 9, 9, 1)', // the Pixaloy host
    ]) {
      expect(keys).not.toContain(absent);
    }
  });

  it('counts font stacks once per visible element with direct text', () => {
    const { fonts, elements } = scanFixture();
    expect(Object.fromEntries(fonts.map((entry) => [entry.family, entry.count]))).toEqual(
      EXPECTED_FONTS,
    );
    expect(fonts[0]!.family).toBe('Inter, sans-serif');
    // 16 rows: minus hidden, hidden-child, invisible, faded and the host.
    expect(elements).toBe(11);
  });
});

describe('colourValues', () => {
  const tag = { localName: 'div', namespaceURI: 'http://www.w3.org/1999/xhtml' };
  const style = (map: Record<string, string>) => ({
    getPropertyValue: (property: string) => map[property] ?? '',
  });

  it('reads fill and stroke only on painted SVG elements', () => {
    const map = { color: 'red', 'background-color': 'blue', fill: 'green', stroke: 'black' };
    expect(colourValues(style(map), tag).map(([property]) => property)).toEqual([
      'color',
      'background-color',
    ]);
    const path = { localName: 'path', namespaceURI: 'http://www.w3.org/2000/svg' };
    expect(colourValues(style(map), path).map(([property]) => property)).toEqual([
      'color',
      'background-color',
      'fill',
      'stroke',
    ]);
  });

  it('reads the outline only when it has a style and a width', () => {
    const base = { 'outline-color': 'red' };
    const outline = (extra: Record<string, string>) =>
      colourValues(style({ ...base, ...extra }), tag).some(([p]) => p === 'outline-color');
    expect(outline({ 'outline-style': 'solid', 'outline-width': '1px' })).toBe(true);
    expect(outline({ 'outline-style': 'none', 'outline-width': '1px' })).toBe(false);
    expect(outline({ 'outline-style': 'solid', 'outline-width': '0px' })).toBe(false);
  });
});

describe('fonts', () => {
  it('finds a direct text node with non-whitespace text', () => {
    expect(hasDirectText({ childNodes: [{ nodeType: 3, nodeValue: ' a ' }] })).toBe(true);
    expect(hasDirectText({ childNodes: [{ nodeType: 3, nodeValue: ' \n ' }] })).toBe(false);
    expect(hasDirectText({ childNodes: [{ nodeType: 1, nodeValue: null }] })).toBe(false);
    expect(hasDirectText({ childNodes: [] })).toBe(false);
  });

  it('reads the pinned element metrics', () => {
    const [, body] = buildFixturePage();
    expect(fontMetrics(fakeStyle(body!))).toEqual({
      family: 'Inter, sans-serif',
      size: '16px',
      weight: '400',
      lineHeight: 'normal',
    });
  });
});
