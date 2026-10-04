/**
 * The page fonts: `font-family` stacks with counts, and the type metrics of
 * one element. Pure, over a computed style and an element's child nodes.
 *
 * Counting rule: the full computed `font-family` stack, once per visible
 * element that has a direct text node child with non-whitespace text. The
 * rendered font (which face in the stack the browser used) waits for a later
 * version.
 */
import type { StyleSource } from './baseline';

const TEXT_NODE = 3;

/** The parts of an element the font count reads. */
export interface TextParent {
  childNodes: ArrayLike<{ nodeType: number; nodeValue: string | null }>;
}

/** Whether the element has a direct text node with non-whitespace text. */
export function hasDirectText(element: TextParent): boolean {
  const { childNodes } = element;
  for (let index = 0; index < childNodes.length; index += 1) {
    const node = childNodes[index]!;
    if (node.nodeType === TEXT_NODE && node.nodeValue && node.nodeValue.trim() !== '') return true;
  }
  return false;
}

export interface FontEntry {
  family: string;
  count: number;
}

/** Counts font stacks one element at a time. */
export class FontCounter {
  private readonly counts = new Map<string, number>();

  add(style: StyleSource): void {
    const family = style.getPropertyValue('font-family').trim();
    if (!family) return;
    this.counts.set(family, (this.counts.get(family) ?? 0) + 1);
  }

  entries(): FontEntry[] {
    return [...this.counts]
      .map(([family, count]) => ({ family, count }))
      .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family));
  }
}

export interface FontMetrics {
  family: string;
  size: string;
  weight: string;
  lineHeight: string;
}

/** The type metrics the Page tab shows for the pinned element. */
export function fontMetrics(style: StyleSource): FontMetrics {
  return {
    family: style.getPropertyValue('font-family').trim(),
    size: style.getPropertyValue('font-size').trim(),
    weight: style.getPropertyValue('font-weight').trim(),
    lineHeight: style.getPropertyValue('line-height').trim(),
  };
}
