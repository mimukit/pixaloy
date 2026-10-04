import { ALL_PROPERTIES, CONDITIONAL_PROPERTIES, CURRENTCOLOR_PROPERTIES } from './properties';

/** Property name to computed value, as `getComputedStyle` serialises it. */
export type StyleMap = Readonly<Record<string, string>>;

/**
 * Whether `property` has its UA default value on the element.
 *
 * The copy contract: a property is dropped only when its value equals the
 * baseline (the same tag in a blank standards-mode page). For a
 * `currentcolor` default, the baseline is `currentcolor` itself, so the value
 * equals it when it equals the element's own `color`.
 */
export function equalsBaseline(property: string, computed: StyleMap, baseline: StyleMap): boolean {
  const value = computed[property];
  if (CURRENTCOLOR_PROPERTIES.has(property)) return value === computed.color;
  return value === baseline[property];
}

/**
 * The properties that differ from the baseline, in copy order. Properties
 * with no computed value (not supported by the browser) are skipped.
 * Inherited values such as `font-family` and `color` stay unless they equal
 * the baseline: the copy must render the same on a blank page.
 */
export function diffAgainstBaseline(
  computed: StyleMap,
  baseline: StyleMap,
  properties: readonly string[] = ALL_PROPERTIES,
): Record<string, string> {
  const changed: Record<string, string> = {};
  for (const property of properties) {
    const value = computed[property];
    if (!value) continue;
    const condition = CONDITIONAL_PROPERTIES[property];
    if (condition && !condition(computed)) continue;
    if (equalsBaseline(property, computed, baseline)) continue;
    changed[property] = value;
  }
  return changed;
}
