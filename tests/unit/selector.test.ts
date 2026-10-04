import { describe, expect, it } from 'vitest';
import { isGeneratedId, isHashedClass } from '../../src/engine';

describe('isHashedClass', () => {
  it.each([
    'css-1x2y3z',
    'css-qhsdjf',
    'css-1x2y3z-Button',
    'sc-abc12',
    'sc-bdVaJa',
    'jsx-123456',
    'jsx-2785915914',
    'emotion-0',
    'svelte-1abc2de',
    'astro-J7PV25F6',
    'jss12',
    '_abc12_',
    '_button_1x2y3_12',
    'Button_primary__3xYz1',
    'Home_main__nLjHq',
    'x1lliihq',
    'c-kAXrhS',
    'bdVaJa',
  ])('rejects the hashed class %s', (name) => {
    expect(isHashedClass(name)).toBe(true);
  });

  it.each([
    'btn',
    'btn-primary',
    'col-12',
    'col-md-6',
    'mt-4',
    'p-2.5',
    'text-2xl',
    'bg-gray-100',
    'md:flex',
    'hover:bg-blue-500',
    'w-1/2',
    'card',
    'card__title',
    'card--active',
    'heading2',
    'isActive',
    'navbar-brand',
    'container',
    'h1',
  ])('keeps the normal class %s', (name) => {
    expect(isHashedClass(name)).toBe(false);
  });
});

describe('isGeneratedId', () => {
  it.each([':r1:', '«r2»', '1abc', 'react-aria-1x2y3'])('rejects %s', (id) => {
    expect(isGeneratedId(id)).toBe(true);
  });

  it.each(['main', 'site-header', 'card', 'section-2', 'first'])('keeps %s', (id) => {
    expect(isGeneratedId(id)).toBe(false);
  });
});
