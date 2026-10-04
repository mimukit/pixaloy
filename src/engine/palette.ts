/**
 * The page palette: colours with usage counts. Pure counting over a computed
 * style, so Vitest feeds it a table instead of a page.
 *
 * Counting rule: one count per visible element per property.
 *
 * - `color` and `background-color` on every element.
 * - Each border side's colour only where that side's width is above 0.
 *   A border with style `none` or `hidden` computes to width 0.
 * - `outline-color` only where `outline-style` is not `none` and
 *   `outline-width` is above 0. The outline paints nothing otherwise.
 * - `fill` and `stroke` only on SVG shape and text elements, and only when
 *   the value is a colour (not `none` or `url(...)`). Every HTML element
 *   computes `fill: rgb(0, 0, 0)`, which would inflate black, and the `<svg>`
 *   and `<g>` containers paint nothing themselves.
 * - `transparent` and any value with alpha 0 never count. A different alpha
 *   is a different colour.
 *
 * Which elements are visible, and the skip of Pixaloy's own nodes, is the
 * caller's job (see `scan.ts`).
 */
import type { Color } from 'culori/fn';
import type { StyleSource } from './baseline';
import { formatColour, parseColour, type ColourFormats } from './colour';

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG elements that paint a fill or a stroke themselves. */
export const SVG_PAINTED_TAGS: ReadonlySet<string> = new Set([
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'text',
  'textPath',
  'tspan',
]);

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

/** The element facts the palette reads besides the style. */
export interface PaletteTag {
  localName: string;
  namespaceURI: string | null;
}

function positive(value: string): boolean {
  return parseFloat(value) > 0;
}

/** Whether the element paints `fill` and `stroke`. */
export function paintsSvg(tag: PaletteTag): boolean {
  return tag.namespaceURI === SVG_NS && SVG_PAINTED_TAGS.has(tag.localName);
}

/**
 * The colour values one element contributes, by property, before parsing.
 * `transparent` and `none` filter out later, in `parseColour`.
 */
export function colourValues(style: StyleSource, tag: PaletteTag): Array<[string, string]> {
  const read = (property: string) => style.getPropertyValue(property);
  const values: Array<[string, string]> = [
    ['color', read('color')],
    ['background-color', read('background-color')],
  ];
  for (const side of SIDES) {
    if (positive(read(`border-${side}-width`))) {
      values.push([`border-${side}-color`, read(`border-${side}-color`)]);
    }
  }
  const outlineStyle = read('outline-style').trim();
  if (outlineStyle && outlineStyle !== 'none' && positive(read('outline-width'))) {
    values.push(['outline-color', read('outline-color')]);
  }
  if (paintsSvg(tag)) {
    values.push(['fill', read('fill')], ['stroke', read('stroke')]);
  }
  return values;
}

export interface PaletteEntry {
  /** The normalized colour, for example `rgba(255, 0, 0, 0.5)`. */
  key: string;
  count: number;
  formats: ColourFormats;
  /** A CSS value for the swatch. */
  swatch: string;
}

/** Counts colours one element at a time, so a chunked scan can feed it. */
export class PaletteCounter {
  private readonly counts = new Map<string, { count: number; value: string; colour: Color }>();

  add(style: StyleSource, tag: PaletteTag): void {
    for (const [, value] of colourValues(style, tag)) {
      const parsed = parseColour(value);
      if (!parsed) continue;
      const entry = this.counts.get(parsed.key);
      if (entry) entry.count += 1;
      else this.counts.set(parsed.key, { count: 1, value, colour: parsed.colour });
    }
  }

  /** Raw counts by key, for tests and debugging. */
  countsByKey(): Record<string, number> {
    return Object.fromEntries([...this.counts].map(([key, { count }]) => [key, count]));
  }

  /** The colours by count, most used first; equal counts sort by key. */
  entries(): PaletteEntry[] {
    return [...this.counts]
      .map(([key, { count, value, colour }]) => ({
        key,
        count,
        formats: formatColour(colour),
        swatch: value.trim(),
      }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }
}
