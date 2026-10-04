/**
 * The minimizer turns the diffed longhands into the copied declarations.
 *
 * It collapses only this fixed list, as the plan settles:
 * `margin`, `padding`, `inset`, `gap`, `border-radius`, `overflow`, and
 * `border` when all four sides match. Every other property stays longhand.
 *
 * A shorthand is written only when every longhand it covers survived the
 * diff. When only some sides survived, those sides stay longhand. The other
 * sides equal the UA default, so a blank page already renders them the same,
 * and writing them back into a shorthand would only make the copy longer.
 *
 * The single exception is the border colour. Its default is `currentcolor`,
 * and the `border` shorthand resets the colour to `currentcolor`, so
 * `border: 1px solid` is exact when the four widths and styles match and no
 * colour survived.
 */
import type { StyleMap } from './diff';

export interface Declaration {
  property: string;
  value: string;
}

type Sides = readonly [top: string, right: string, bottom: string, left: string];

/** `1px 2px 1px 2px` → `1px 2px`: the shortest 1 to 4 value form. */
export function shortenSides([top, right, bottom, left]: Sides): string {
  if (right === left) {
    if (top === bottom) return top === right ? top : `${top} ${right}`;
    return `${top} ${right} ${bottom}`;
  }
  return `${top} ${right} ${bottom} ${left}`;
}

/** Collapse four longhands into one shorthand when all four are present. */
function boxShorthand(property: string, longhands: Sides) {
  return {
    property,
    longhands,
    collapse(changed: StyleMap): string | null {
      const values = longhands.map((longhand) => changed[longhand]);
      if (values.some((value) => value === undefined)) return null;
      return shortenSides(values as unknown as Sides);
    },
  };
}

/** `8px` or `8px 4px` (horizontal, vertical) per corner. */
function splitRadius(value: string): [string, string] {
  const [horizontal = value, vertical = horizontal] = value.trim().split(/\s+/);
  return [horizontal, vertical];
}

const CORNERS = [
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
] as const;

const BORDER_SIDES = ['top', 'right', 'bottom', 'left'] as const;
const BORDER_WIDTHS = BORDER_SIDES.map((side) => `border-${side}-width`);
const BORDER_STYLES = BORDER_SIDES.map((side) => `border-${side}-style`);
const BORDER_COLORS = BORDER_SIDES.map((side) => `border-${side}-color`);

/** One value when all are present and equal, else null. */
function allSame(changed: StyleMap, longhands: readonly string[]): string | null {
  const first = changed[longhands[0]!];
  if (first === undefined) return null;
  return longhands.every((longhand) => changed[longhand] === first) ? first : null;
}

interface Shorthand {
  property: string;
  longhands: readonly string[];
  collapse: (changed: StyleMap) => string | null;
}

export const SHORTHANDS: readonly Shorthand[] = [
  boxShorthand('margin', ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']),
  boxShorthand('padding', ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']),
  boxShorthand('inset', ['top', 'right', 'bottom', 'left']),
  {
    property: 'gap',
    longhands: ['row-gap', 'column-gap'],
    collapse(changed) {
      const row = changed['row-gap'];
      const column = changed['column-gap'];
      if (row === undefined || column === undefined) return null;
      return row === column ? row : `${row} ${column}`;
    },
  },
  {
    property: 'overflow',
    longhands: ['overflow-x', 'overflow-y'],
    collapse(changed) {
      const x = changed['overflow-x'];
      const y = changed['overflow-y'];
      if (x === undefined || y === undefined) return null;
      return x === y ? x : `${x} ${y}`;
    },
  },
  {
    property: 'border-radius',
    longhands: CORNERS,
    collapse(changed) {
      const values = CORNERS.map((corner) => changed[corner]);
      if (values.some((value) => value === undefined)) return null;
      const corners = (values as string[]).map(splitRadius);
      const horizontal = shortenSides(corners.map(([h]) => h) as unknown as Sides);
      const vertical = shortenSides(corners.map(([, v]) => v) as unknown as Sides);
      return horizontal === vertical ? horizontal : `${horizontal} / ${vertical}`;
    },
  },
  {
    property: 'border',
    longhands: [...BORDER_WIDTHS, ...BORDER_STYLES, ...BORDER_COLORS],
    collapse(changed) {
      const width = allSame(changed, BORDER_WIDTHS);
      const style = allSame(changed, BORDER_STYLES);
      if (width === null || style === null) return null;
      const color = allSame(changed, BORDER_COLORS);
      if (color !== null) return `${width} ${style} ${color}`;
      // No colour survived: all four are `currentcolor`, the shorthand's own reset.
      const anyColor = BORDER_COLORS.some((longhand) => changed[longhand] !== undefined);
      return anyColor ? null : `${width} ${style}`;
    },
  },
];

const SHORTHAND_OF = new Map<string, Shorthand>(
  SHORTHANDS.flatMap((shorthand) => shorthand.longhands.map((longhand) => [longhand, shorthand])),
);

/**
 * Collapse the diffed longhands. The output keeps the input order; a
 * shorthand takes the place of its first longhand.
 */
export function minimize(changed: StyleMap): Declaration[] {
  const declarations: Declaration[] = [];
  const decided = new Map<Shorthand, string | null>();
  for (const [property, value] of Object.entries(changed)) {
    const shorthand = SHORTHAND_OF.get(property);
    if (!shorthand) {
      declarations.push({ property, value });
      continue;
    }
    if (!decided.has(shorthand)) {
      const collapsed = shorthand.collapse(changed);
      decided.set(shorthand, collapsed);
      if (collapsed !== null) declarations.push({ property: shorthand.property, value: collapsed });
    }
    if (decided.get(shorthand) === null) declarations.push({ property, value });
  }
  return declarations;
}
