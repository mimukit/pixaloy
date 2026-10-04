import { describe, expect, it } from 'vitest';
import { formatColour, parseColour } from '../../src/engine';

function formats(value: string) {
  const parsed = parseColour(value);
  if (!parsed) throw new Error(`not a colour: ${value}`);
  return formatColour(parsed.colour);
}

describe('parseColour', () => {
  it('keys the same colour the same way from any spelling', () => {
    expect(parseColour('rgb(255, 0, 0)')!.key).toBe('rgba(255, 0, 0, 1)');
    expect(parseColour('#f00')!.key).toBe('rgba(255, 0, 0, 1)');
    expect(parseColour('red')!.key).toBe('rgba(255, 0, 0, 1)');
    expect(parseColour('rgba(255, 0, 0, 0.5)')!.key).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('keeps a different alpha a different colour', () => {
    expect(parseColour('rgba(0, 0, 0, 0.5)')!.key).not.toBe(parseColour('rgba(0, 0, 0, 0.6)')!.key);
  });

  it('drops transparent, alpha 0 and non-colours', () => {
    for (const value of ['transparent', 'rgba(10, 20, 30, 0)', 'none', '', 'url("#g")']) {
      expect(parseColour(value)).toBeNull();
    }
  });

  it('keeps a wide-gamut colour in its own space', () => {
    expect(parseColour('oklch(0.7 0.3 140)')!.key).toBe('oklch(0.7 0.3 140)');
  });
});

describe('formatColour', () => {
  it('formats an opaque colour in HEX, RGB, HSL and OKLCH', () => {
    expect(formats('rgb(255, 0, 0)')).toEqual({
      hex: '#ff0000',
      rgb: 'rgb(255, 0, 0)',
      hsl: 'hsl(0, 100%, 50%)',
      oklch: 'oklch(0.628 0.258 29.23)',
    });
  });

  it('keeps an alpha below 1 in every format', () => {
    expect(formats('rgba(0, 102, 204, 0.5)')).toEqual({
      hex: '#0066cc80',
      rgb: 'rgba(0, 102, 204, 0.5)',
      hsl: 'hsla(210, 100%, 40%, 0.5)',
      oklch: 'oklch(0.522 0.177 255.83 / 0.5)',
    });
  });

  it('gives an achromatic colour hue 0', () => {
    expect(formats('rgb(255, 255, 255)').oklch).toBe('oklch(1 0 0)');
  });
});
