/** Arrow-key moves over the element tree. Each skips Pixaloy's own host. */

export type Direction = 'parent' | 'child' | 'previous' | 'next';

type IsOwn = (element: Element) => boolean;

export function move(element: Element, direction: Direction, isOwn: IsOwn): Element | null {
  switch (direction) {
    case 'parent':
      return element.parentElement;
    case 'child':
      return skip(element.firstElementChild, (el) => el.nextElementSibling, isOwn);
    case 'previous':
      return skip(element.previousElementSibling, (el) => el.previousElementSibling, isOwn);
    case 'next':
      return skip(element.nextElementSibling, (el) => el.nextElementSibling, isOwn);
  }
}

function skip(
  start: Element | null,
  step: (element: Element) => Element | null,
  isOwn: IsOwn,
): Element | null {
  let current = start;
  while (current && isOwn(current)) current = step(current);
  return current;
}

export const ARROW_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ArrowUp: 'parent',
  ArrowDown: 'child',
  ArrowLeft: 'previous',
  ArrowRight: 'next',
};
