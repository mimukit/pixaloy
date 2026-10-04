import { finder } from '@medv/finder';

/**
 * Prefixes CSS-in-JS libraries put before a generated hash: emotion (`css-`,
 * `emotion-`), styled-components (`sc-`), styled-jsx (`jsx-`), Svelte
 * (`svelte-`), Astro (`astro-`), JSS (`jss`), glamor (`glamor-`).
 */
const HASH_PREFIX = /^(?:css|emotion|sc|jsx|svelte|astro|glamor)-[a-z0-9]+(?:-|$)|^jss\d+$/i;

/**
 * Whether one `-` or `_` separated part of a name looks like a generated
 * hash rather than a word:
 *
 * - letters and digits mixed with a digit before a letter (`1x2y3z`,
 *   `x1lliihq`, `3xYz1`); a trailing number such as `heading2` is a word,
 * - five or more letters with two or more capitals after the first
 *   (`bdVaJa`, `nLjHq`); camelCase with one capital (`isActive`) is a word.
 */
function isHashPart(part: string): boolean {
  if (part.length < 5 || !/^[a-z0-9]+$/i.test(part)) return false;
  if (/\d[a-z]/i.test(part)) return true;
  if (/^[a-z]+$/i.test(part)) return (part.slice(1).match(/[A-Z]/g) ?? []).length >= 2;
  return false;
}

/**
 * Whether a class name is a hashed CSS-in-JS or CSS-modules class, which
 * changes on the next deploy and makes a brittle selector.
 *
 * Rejects `css-1x2y3z`, `sc-abc12`, `jsx-123456`, `emotion-0`, `_abc12_`,
 * `Button_primary__3xYz1`, `Home_main__nLjHq`, `x1lliihq`. Keeps `btn-primary`,
 * `col-12`, `mt-4`, `card__title`, `text-2xl`, `md:flex`.
 *
 * A false reject costs little (finder picks another part of the path); a
 * false accept gives a selector that breaks, so the filter leans to reject.
 */
export function isHashedClass(name: string): boolean {
  if (HASH_PREFIX.test(name)) return true;
  const parts = name.split(/[-_]+/).filter(Boolean);
  // CSS modules (Vite): `_name_hash_line`, a leading underscore and a part with a digit.
  if (name.startsWith('_') && parts.some((part) => /\d/.test(part))) return true;
  return parts.some(isHashPart);
}

/** Ids from generators: React `useId` (`:r1:`, `«r1»`) and hashed parts. */
export function isGeneratedId(id: string): boolean {
  return /^[:«]/.test(id) || /^\d/.test(id) || id.split(/[-_]+/).some(isHashPart);
}

/**
 * A unique CSS selector for `element` in its document, from `@medv/finder`
 * with the hashed-class and generated-id filters.
 */
export function uniqueSelector(element: Element): string {
  const root = element.ownerDocument.body ?? element.ownerDocument.documentElement;
  return finder(element, {
    root,
    className: (name) => !isHashedClass(name),
    idName: (id) => !isGeneratedId(id),
  });
}
