/**
 * Colour parsing, keys and display formats for the page palette, through
 * culori's tree-shakeable `culori/fn` build. Plain TypeScript, no DOM.
 */
import {
  clampRgb,
  converter,
  formatHex,
  formatHex8,
  formatHsl,
  formatRgb,
  modeA98,
  modeHsl,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeP3,
  modeProphoto,
  modeRec2020,
  modeRgb,
  modeXyz50,
  modeXyz65,
  parse,
  useMode as registerMode,
  type Color,
} from 'culori/fn';

// Every colour space a computed value can come back in. Chrome serializes the
// legacy forms (names, hex, hsl(), hwb()) as rgb()/rgba(); the rest keep their
// own function, for example `oklch(...)`, `lab(...)` or `color(display-p3 ...)`.
for (const mode of [
  modeRgb,
  modeHsl,
  modeLab,
  modeLch,
  modeOklab,
  modeOklch,
  modeLrgb,
  modeP3,
  modeRec2020,
  modeA98,
  modeProphoto,
  modeXyz50,
  modeXyz65,
]) {
  registerMode(mode);
}

const toOklch = converter('oklch');

/** One page colour in the four formats the panel shows. */
export interface ColourFormats {
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
}

/** A parsed colour and the key that merges equal values across properties. */
export interface ParsedColour {
  key: string;
  colour: Color;
}

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const channel = (value: number | undefined) =>
  Math.round(Math.max(0, Math.min(1, value ?? 0)) * 255);

function alphaOf(colour: Color): number {
  return colour.alpha ?? 1;
}

/**
 * Parse a computed colour value. Returns null for anything that paints
 * nothing or is not a colour: `transparent`, alpha 0, `none`, `url(...)`,
 * the empty string.
 *
 * The key is a normalized `rgba(r, g, b, a)` string for sRGB colours (alpha
 * to three decimals), so the same colour from `color` and `border-top-color`
 * merges, and a different alpha stays a different colour. Colours in another
 * space keep their CSS form as the key, so a wide-gamut colour does not merge
 * with its clamped sRGB neighbour.
 */
export function parseColour(value: string): ParsedColour | null {
  const text = value.trim();
  if (!text || text === 'none' || text === 'transparent') return null;
  const colour = parse(text);
  if (!colour) return null;
  const alpha = alphaOf(colour);
  if (!(alpha > 0)) return null;
  if (colour.mode === 'rgb') {
    const key = `rgba(${channel(colour.r)}, ${channel(colour.g)}, ${channel(colour.b)}, ${round(alpha, 3)})`;
    return { key, colour };
  }
  return { key: text.replace(/\s+/g, ' '), colour };
}

function formatOklch(colour: Color): string {
  const { l, c, h, alpha } = toOklch(colour);
  const hue = h === undefined || Number.isNaN(h) ? 0 : h;
  const body = `${round(l, 3)} ${round(c, 3)} ${round(hue, 2)}`;
  return alpha === undefined || alpha >= 1
    ? `oklch(${body})`
    : `oklch(${body} / ${round(alpha, 3)})`;
}

/**
 * HEX, RGB, HSL and OKLCH for a colour. HEX, RGB and HSL clamp to sRGB; OKLCH
 * keeps the full colour. An alpha below 1 shows in every format: an 8-digit
 * hex, `rgba()`, `hsla()` and `oklch(... / a)`.
 */
export function formatColour(colour: Color): ColourFormats {
  const srgb = clampRgb(colour);
  const translucent = alphaOf(colour) < 1;
  return {
    hex: (translucent ? formatHex8(srgb) : formatHex(srgb)) ?? '',
    rgb: formatRgb(srgb) ?? '',
    hsl: formatHsl(srgb) ?? '',
    oklch: formatOklch(colour),
  };
}
