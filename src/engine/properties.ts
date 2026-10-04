/**
 * The computed properties the style engine reads, in five display groups.
 *
 * The list is curated, not the ~400 properties `getComputedStyle` returns:
 * longhands that change how an element renders on its own. Left out on
 * purpose:
 *
 * - vendor-prefixed (`-webkit-*`) and custom (`--*`) properties,
 * - transitions and animations (they change behaviour over time, not the
 *   rendered result),
 * - `perspective-origin` and other values that resolve to layout pixels and
 *   only matter together with a property the list does not read.
 *
 * `transform-origin` resolves to layout pixels too. It is read only when the
 * element has a transform (see `CONDITIONAL_PROPERTIES`).
 *
 * The order here is the order of the copied CSS.
 */
export const PROPERTY_GROUPS = {
  layout: [
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'z-index',
    'float',
    'clear',
    'flex-direction',
    'flex-wrap',
    'justify-content',
    'align-items',
    'align-content',
    'justify-items',
    'align-self',
    'justify-self',
    'order',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'grid-template-columns',
    'grid-template-rows',
    'grid-template-areas',
    'grid-auto-flow',
    'grid-auto-columns',
    'grid-auto-rows',
    'grid-column-start',
    'grid-column-end',
    'grid-row-start',
    'grid-row-end',
    'row-gap',
    'column-gap',
    'overflow-x',
    'overflow-y',
    'vertical-align',
    'visibility',
  ],
  box: [
    'box-sizing',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'aspect-ratio',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'border-top-width',
    'border-right-width',
    'border-bottom-width',
    'border-left-width',
    'border-top-style',
    'border-right-style',
    'border-bottom-style',
    'border-left-style',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
    'object-fit',
    'object-position',
  ],
  typography: [
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'font-stretch',
    'font-variant-caps',
    'font-variant-numeric',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'text-align',
    'text-indent',
    'text-transform',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-color',
    'text-decoration-thickness',
    'text-underline-offset',
    'text-overflow',
    'white-space',
    'word-break',
    'overflow-wrap',
    'list-style-type',
    'list-style-position',
  ],
  colour: [
    'color',
    'background-color',
    'background-image',
    'background-size',
    'background-position-x',
    'background-position-y',
    'background-repeat',
    'background-clip',
    'background-origin',
    'background-attachment',
    'fill',
    'stroke',
    'stroke-width',
    'accent-color',
  ],
  effects: [
    'opacity',
    'box-shadow',
    'text-shadow',
    'transform',
    'translate',
    'rotate',
    'scale',
    'transform-origin',
    'filter',
    'backdrop-filter',
    'mix-blend-mode',
    'clip-path',
    'outline-width',
    'outline-style',
    'outline-color',
    'outline-offset',
    'cursor',
    'pointer-events',
  ],
} as const satisfies Record<string, readonly string[]>;

export type GroupId = keyof typeof PROPERTY_GROUPS;

export const GROUP_LABELS: Readonly<Record<GroupId, string>> = {
  layout: 'Layout',
  box: 'Box',
  typography: 'Typography',
  colour: 'Colour',
  effects: 'Effects',
};

export const GROUP_ORDER: readonly GroupId[] = ['layout', 'box', 'typography', 'colour', 'effects'];

/** Every property the engine reads, in copy order. */
export const ALL_PROPERTIES: readonly string[] = GROUP_ORDER.flatMap((id) => PROPERTY_GROUPS[id]);

/**
 * Properties whose UA default is `currentcolor`. `getComputedStyle` resolves
 * `currentcolor` to the element's own `color`, so the raw baseline value
 * (the baseline element's black) is the wrong thing to compare against. For
 * these, "equals the baseline" means "equals the element's own `color`".
 */
export const CURRENTCOLOR_PROPERTIES: ReadonlySet<string> = new Set([
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
]);

/**
 * Properties the engine considers only when a condition on the computed map
 * holds. `transform-origin` resolves to layout pixels (`166px 20px`), which
 * never equals the baseline, but it only changes the render when something
 * transforms the element.
 */
export const CONDITIONAL_PROPERTIES: Readonly<
  Record<string, (computed: Readonly<Record<string, string>>) => boolean>
> = {
  'transform-origin': (computed) =>
    ['transform', 'translate', 'rotate', 'scale'].some(
      (property) => (computed[property] ?? 'none') !== 'none',
    ),
};
