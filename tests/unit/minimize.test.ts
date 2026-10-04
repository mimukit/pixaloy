import { describe, expect, it } from 'vitest';
import { buildReport, minimize, shortenSides } from '../../src/engine';

/** A div's UA defaults in a blank standards-mode page (the parts the fixtures touch). */
const DIV: Record<string, string> = {
  display: 'block',
  position: 'static',
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto',
  'row-gap': 'normal',
  'column-gap': 'normal',
  'overflow-x': 'visible',
  'overflow-y': 'visible',
  'box-sizing': 'content-box',
  width: 'auto',
  'margin-top': '0px',
  'margin-right': '0px',
  'margin-bottom': '0px',
  'margin-left': '0px',
  'padding-top': '0px',
  'padding-right': '0px',
  'padding-bottom': '0px',
  'padding-left': '0px',
  'border-top-width': '0px',
  'border-right-width': '0px',
  'border-bottom-width': '0px',
  'border-left-width': '0px',
  'border-top-style': 'none',
  'border-right-style': 'none',
  'border-bottom-style': 'none',
  'border-left-style': 'none',
  'border-top-color': 'rgb(0, 0, 0)',
  'border-right-color': 'rgb(0, 0, 0)',
  'border-bottom-color': 'rgb(0, 0, 0)',
  'border-left-color': 'rgb(0, 0, 0)',
  'border-top-left-radius': '0px',
  'border-top-right-radius': '0px',
  'border-bottom-right-radius': '0px',
  'border-bottom-left-radius': '0px',
  'font-family': '"Times New Roman"',
  'font-size': '16px',
  'line-height': 'normal',
  'text-decoration-color': 'rgb(0, 0, 0)',
  color: 'rgb(0, 0, 0)',
  'background-color': 'rgba(0, 0, 0, 0)',
  transform: 'none',
  'transform-origin': '50% 50%',
  'outline-color': 'rgb(0, 0, 0)',
};

const sides = (prefix: string, suffix: string, [t, r, b, l]: string[]) => ({
  [`${prefix}-top${suffix}`]: t!,
  [`${prefix}-right${suffix}`]: r!,
  [`${prefix}-bottom${suffix}`]: b!,
  [`${prefix}-left${suffix}`]: l!,
});

/** The CSS a div with `overrides` copies to. */
const copy = (overrides: Record<string, string>) => buildReport({ ...DIV, ...overrides }, DIV).css;

interface Fixture {
  name: string;
  computed: Record<string, string>;
  expected: string;
}

const FIXTURES: Fixture[] = [
  {
    name: 'margin, four equal sides',
    computed: sides('margin', '', ['8px', '8px', '8px', '8px']),
    expected: 'margin: 8px;',
  },
  {
    name: 'margin, three-value form',
    computed: sides('margin', '', ['4px', '8px', '12px', '8px']),
    expected: 'margin: 4px 8px 12px;',
  },
  {
    name: 'padding, two-value form',
    computed: sides('padding', '', ['4px', '8px', '4px', '8px']),
    expected: 'padding: 4px 8px;',
  },
  {
    name: 'padding, four-value form',
    computed: sides('padding', '', ['1px', '2px', '3px', '4px']),
    expected: 'padding: 1px 2px 3px 4px;',
  },
  {
    name: 'inset on an absolute element',
    computed: { position: 'absolute', top: '0px', right: '10px', bottom: '0px', left: '10px' },
    expected: 'position: absolute;\ninset: 0px 10px;',
  },
  {
    name: 'gap, row and column differ',
    computed: { display: 'flex', 'row-gap': '8px', 'column-gap': '16px' },
    expected: 'display: flex;\ngap: 8px 16px;',
  },
  {
    name: 'gap, equal',
    computed: { display: 'grid', 'row-gap': '12px', 'column-gap': '12px' },
    expected: 'display: grid;\ngap: 12px;',
  },
  {
    name: 'border-radius, circular and elliptical corners',
    computed: {
      'border-top-left-radius': '8px 4px',
      'border-top-right-radius': '8px 4px',
      'border-bottom-right-radius': '8px 4px',
      'border-bottom-left-radius': '8px 4px',
    },
    expected: 'border-radius: 8px / 4px;',
  },
  {
    name: 'border-radius, two-value form',
    computed: {
      'border-top-left-radius': '6px',
      'border-top-right-radius': '2px',
      'border-bottom-right-radius': '6px',
      'border-bottom-left-radius': '2px',
    },
    expected: 'border-radius: 6px 2px;',
  },
  {
    name: 'partial border-radius: two corners stay longhand',
    computed: {
      'border-top-left-radius': '6px',
      'border-top-right-radius': '0px',
      'border-bottom-right-radius': '6px',
      'border-bottom-left-radius': '0px',
    },
    // The 0px corners equal the baseline and drop, so only two corners survive.
    expected: 'border-top-left-radius: 6px;\nborder-bottom-right-radius: 6px;',
  },
  {
    name: 'overflow, x and y differ',
    computed: { 'overflow-x': 'hidden', 'overflow-y': 'auto' },
    expected: 'overflow: hidden auto;',
  },
  {
    name: 'border, all four sides match',
    computed: {
      ...sides('border', '-width', ['2px', '2px', '2px', '2px']),
      ...sides('border', '-style', ['solid', 'solid', 'solid', 'solid']),
      ...sides('border', '-color', Array(4).fill('rgb(200, 0, 0)')),
    },
    expected: 'border: 2px solid rgb(200, 0, 0);',
  },
  {
    name: 'border in currentcolor: the shorthand omits the colour',
    computed: {
      color: 'rgb(0, 128, 0)',
      'text-decoration-color': 'rgb(0, 128, 0)',
      'outline-color': 'rgb(0, 128, 0)',
      ...sides('border', '-width', ['1px', '1px', '1px', '1px']),
      ...sides('border', '-style', ['dashed', 'dashed', 'dashed', 'dashed']),
      ...sides('border', '-color', Array(4).fill('rgb(0, 128, 0)')),
    },
    expected: 'border: 1px dashed;\ncolor: rgb(0, 128, 0);',
  },
  {
    name: 'border mismatch: one side wider stays longhand',
    computed: {
      ...sides('border', '-width', ['1px', '1px', '3px', '1px']),
      ...sides('border', '-style', ['solid', 'solid', 'solid', 'solid']),
      ...sides('border', '-color', Array(4).fill('rgb(1, 2, 3)')),
    },
    expected: [
      'border-top-width: 1px;',
      'border-right-width: 1px;',
      'border-bottom-width: 3px;',
      'border-left-width: 1px;',
      'border-top-style: solid;',
      'border-right-style: solid;',
      'border-bottom-style: solid;',
      'border-left-style: solid;',
      'border-top-color: rgb(1, 2, 3);',
      'border-right-color: rgb(1, 2, 3);',
      'border-bottom-color: rgb(1, 2, 3);',
      'border-left-color: rgb(1, 2, 3);',
    ].join('\n'),
  },
  {
    name: 'border mismatch: colours differ per side',
    computed: {
      ...sides('border', '-width', ['1px', '1px', '1px', '1px']),
      ...sides('border', '-style', ['solid', 'solid', 'solid', 'solid']),
      ...sides('border', '-color', [
        'rgb(255, 0, 0)',
        'rgb(255, 0, 0)',
        'rgb(255, 0, 0)',
        'rgb(0, 0, 255)',
      ]),
    },
    expected: [
      ...['top', 'right', 'bottom', 'left'].map((side) => `border-${side}-width: 1px;`),
      ...['top', 'right', 'bottom', 'left'].map((side) => `border-${side}-style: solid;`),
      'border-top-color: rgb(255, 0, 0);',
      'border-right-color: rgb(255, 0, 0);',
      'border-bottom-color: rgb(255, 0, 0);',
      'border-left-color: rgb(0, 0, 255);',
    ].join('\n'),
  },
  {
    name: 'border on one side only stays longhand',
    computed: {
      'border-bottom-width': '1px',
      'border-bottom-style': 'solid',
      'border-bottom-color': 'rgb(9, 9, 9)',
    },
    expected:
      'border-bottom-width: 1px;\nborder-bottom-style: solid;\nborder-bottom-color: rgb(9, 9, 9);',
  },
  {
    name: 'partial margin: only the surviving side, no shorthand',
    computed: { 'margin-top': '16px' },
    expected: 'margin-top: 16px;',
  },
  {
    name: 'partial padding: three sides stay longhand',
    computed: sides('padding', '', ['4px', '4px', '0px', '4px']),
    expected: 'padding-top: 4px;\npadding-right: 4px;\npadding-left: 4px;',
  },
  {
    name: 'partial inset: sticky top only',
    computed: { position: 'sticky', top: '0px' },
    expected: 'position: sticky;\ntop: 0px;',
  },
  {
    name: 'inherited values stay unless they equal the baseline',
    computed: {
      'font-family': 'Inter, sans-serif',
      'line-height': '24px',
      color: 'rgb(0, 0, 0)',
      'box-sizing': 'border-box',
      display: 'block',
    },
    expected: 'box-sizing: border-box;\nfont-family: Inter, sans-serif;\nline-height: 24px;',
  },
  {
    name: 'a black border under red text is not currentcolor and stays',
    computed: {
      color: 'rgb(255, 0, 0)',
      'text-decoration-color': 'rgb(255, 0, 0)',
      'outline-color': 'rgb(255, 0, 0)',
      ...sides('border', '-width', ['1px', '1px', '1px', '1px']),
      ...sides('border', '-style', ['solid', 'solid', 'solid', 'solid']),
    },
    expected: 'border: 1px solid rgb(0, 0, 0);\ncolor: rgb(255, 0, 0);',
  },
  {
    name: 'transform-origin only counts when the element transforms',
    computed: { 'transform-origin': '160px 34px' },
    expected: '',
  },
  {
    name: 'transform-origin kept with a transform',
    computed: { transform: 'matrix(1, 0, 0, 1, 10, 0)', 'transform-origin': '0px 0px' },
    expected: 'transform: matrix(1, 0, 0, 1, 10, 0);\ntransform-origin: 0px 0px;',
  },
];

describe('minimizer fixtures (computed map + baseline map → copied CSS)', () => {
  it.each(FIXTURES)('$name', ({ computed, expected }) => {
    expect(copy(computed)).toBe(expected);
  });

  it('has at least 10 fixtures and one per collapsed shorthand', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(10);
    const copied = FIXTURES.map(({ computed }) => copy(computed)).join('\n');
    for (const shorthand of ['margin', 'padding', 'inset', 'gap', 'border-radius', 'overflow']) {
      expect(copied).toMatch(new RegExp(`^${shorthand}: `, 'm'));
    }
    expect(copied).toMatch(/^border: /m);
  });
});

describe('minimize', () => {
  it('collapses only the fixed shorthand list; other groups stay longhand', () => {
    const declarations = minimize({
      'flex-grow': '1',
      'flex-shrink': '0',
      'flex-basis': '0%',
      'grid-row-start': '1',
      'grid-row-end': '3',
      'background-position-x': '0%',
      'background-position-y': '50%',
      'outline-width': '2px',
      'outline-style': 'solid',
      'outline-color': 'red',
    });
    expect(declarations.map((declaration) => declaration.property)).toEqual([
      'flex-grow',
      'flex-shrink',
      'flex-basis',
      'grid-row-start',
      'grid-row-end',
      'background-position-x',
      'background-position-y',
      'outline-width',
      'outline-style',
      'outline-color',
    ]);
  });

  it('puts a shorthand where its first longhand was, and keeps the order', () => {
    const declarations = minimize({
      display: 'block',
      'padding-top': '1px',
      color: 'red',
      'padding-right': '1px',
      'padding-bottom': '1px',
      'padding-left': '1px',
    });
    expect(declarations).toEqual([
      { property: 'display', value: 'block' },
      { property: 'padding', value: '1px' },
      { property: 'color', value: 'red' },
    ]);
  });

  it('gives the same output for the same input', () => {
    const computed = { ...DIV, ...sides('margin', '', ['1px', '2px', '1px', '2px']), color: 'red' };
    expect(buildReport(computed, DIV).css).toBe(buildReport({ ...computed }, DIV).css);
  });
});

describe('shortenSides', () => {
  it.each([
    [['1px', '1px', '1px', '1px'], '1px'],
    [['1px', '2px', '1px', '2px'], '1px 2px'],
    [['1px', '2px', '3px', '2px'], '1px 2px 3px'],
    [['1px', '2px', '1px', '3px'], '1px 2px 1px 3px'],
    [['1px', '1px', '2px', '1px'], '1px 1px 2px'],
  ])('%j → %s', (input, expected) => {
    expect(shortenSides(input as [string, string, string, string])).toBe(expected);
  });
});

describe('buildReport groups', () => {
  it('lists computed values in the five groups and marks the changed ones', () => {
    const report = buildReport({ ...DIV, 'box-sizing': 'border-box' }, DIV);
    expect(report.groups.map((group) => group.id)).toEqual([
      'layout',
      'box',
      'typography',
      'colour',
      'effects',
    ]);
    const box = report.groups.find((group) => group.id === 'box')!;
    expect(box.rows.find((row) => row.property === 'box-sizing')).toEqual({
      property: 'box-sizing',
      value: 'border-box',
      changed: true,
    });
    expect(box.rows.find((row) => row.property === 'width')?.changed).toBe(false);
  });
});
