export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Edges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The four CSS boxes of an element, in viewport coordinates. */
export interface BoxModel {
  margin: Rect;
  border: Rect;
  padding: Rect;
  content: Rect;
  marginEdges: Edges;
  borderEdges: Edges;
  paddingEdges: Edges;
}

/** Grow a rect by edges. Negative edges shrink it. */
export function outset(rect: Rect, edges: Edges): Rect {
  return {
    x: rect.x - edges.left,
    y: rect.y - edges.top,
    width: Math.max(0, rect.width + edges.left + edges.right),
    height: Math.max(0, rect.height + edges.top + edges.bottom),
  };
}

export function inset(rect: Rect, edges: Edges): Rect {
  return outset(rect, {
    top: -edges.top,
    right: -edges.right,
    bottom: -edges.bottom,
    left: -edges.left,
  });
}

/** Build the box model from the border box and the three edge sets. */
export function boxModelFromBorderBox(
  border: Rect,
  marginEdges: Edges,
  borderEdges: Edges,
  paddingEdges: Edges,
): BoxModel {
  const padding = inset(border, borderEdges);
  return {
    margin: outset(border, marginEdges),
    border,
    padding,
    content: inset(padding, paddingEdges),
    marginEdges,
    borderEdges,
    paddingEdges,
  };
}

function edges(style: CSSStyleDeclaration, prefix: string, suffix = ''): Edges {
  const read = (side: string) =>
    Number.parseFloat(style.getPropertyValue(`${prefix}-${side}${suffix}`)) || 0;
  return { top: read('top'), right: read('right'), bottom: read('bottom'), left: read('left') };
}

/** Measure an element's box model from its layout. */
export function measureBoxModel(element: Element): BoxModel {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return boxModelFromBorderBox(
    { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
    edges(style, 'margin'),
    edges(style, 'border', '-width'),
    edges(style, 'padding'),
  );
}

/** `div.card.primary`: the tag and the classes. */
export function describeElement(element: Element): { tag: string; classes: string[] } {
  return {
    tag: element.tagName.toLowerCase(),
    classes: Array.from(element.classList),
  };
}

/** `320 × 48`, rounded to at most two decimals. */
export function formatSize(width: number, height: number): string {
  const round = (value: number) => String(Math.round(value * 100) / 100);
  return `${round(width)} × ${round(height)}`;
}
