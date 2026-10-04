/**
 * The style engine: read, baseline, diff, minimize, format, and the unique
 * selector. Plain TypeScript with no UI framework import (ESLint enforces it),
 * so Vitest runs it on plain maps and v2 can add authored-CSS layers behind
 * the same interface.
 */
import { readStyle, type BaselineProvider, type StyleSource } from './baseline';
import { diffAgainstBaseline, type StyleMap } from './diff';
import { formatDeclarations } from './format';
import { isPixaloyNode } from './guard';
import { minimize, type Declaration } from './minimize';
import { GROUP_LABELS, GROUP_ORDER, PROPERTY_GROUPS, type GroupId } from './properties';

export * from './baseline';
export * from './colour';
export * from './diff';
export * from './fonts';
export * from './format';
export * from './guard';
export * from './minimize';
export * from './palette';
export * from './properties';
export * from './scan';
export * from './scheduler';
export * from './selector';

export interface StyleRow {
  property: string;
  value: string;
  /** The value differs from the baseline, so the copy keeps it. */
  changed: boolean;
}

export interface StyleGroup {
  id: GroupId;
  label: string;
  rows: StyleRow[];
}

export interface StyleReport {
  computed: StyleMap;
  changed: StyleMap;
  declarations: Declaration[];
  /** The minimized CSS, one `property: value;` per line. */
  css: string;
  groups: StyleGroup[];
}

/** Diff, minimize and format plain maps. No DOM. */
export function buildReport(computed: StyleMap, baseline: StyleMap): StyleReport {
  const changed = diffAgainstBaseline(computed, baseline);
  const declarations = minimize(changed);
  const groups = GROUP_ORDER.map((id) => ({
    id,
    label: GROUP_LABELS[id],
    rows: PROPERTY_GROUPS[id]
      .filter((property) => computed[property])
      .map((property) => ({
        property,
        value: computed[property]!,
        changed: property in changed,
      })),
  }));
  return { computed, changed, declarations, css: formatDeclarations(declarations), groups };
}

export interface ExtractOptions {
  baseline: BaselineProvider;
  /** Defaults to the element window's `getComputedStyle`. Tests pass a fake. */
  getStyle?: (element: Element) => StyleSource;
}

/**
 * Read an element's computed style and build its report. Returns null for
 * Pixaloy's own nodes (the host, its shadow tree, the baseline iframe and its
 * document), so the engine never reads or copies itself.
 */
export function extractStyles(element: Element, options: ExtractOptions): StyleReport | null {
  if (isPixaloyNode(element)) return null;
  const getStyle =
    options.getStyle ??
    ((target: Element) => (target.ownerDocument.defaultView ?? window).getComputedStyle(target));
  const computed = readStyle(getStyle(element));
  const baseline = options.baseline.styleFor(element);
  return buildReport(computed, baseline);
}
