import type { Declaration } from './minimize';

/** One `property: value;` line per declaration, in the given order. */
export function formatDeclarations(declarations: readonly Declaration[]): string {
  return declarations.map(({ property, value }) => `${property}: ${value};`).join('\n');
}
