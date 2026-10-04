import { describe, expect, it } from 'vitest';
import { createInspectorStore, selectTarget } from '../../src/inspector/store';

const element = (name: string) => ({ name }) as unknown as Element;

describe('inspector store', () => {
  it('outlines the pinned element over the hovered one', () => {
    const store = createInspectorStore();
    const a = element('a');
    const b = element('b');
    store.getState().hover(a);
    expect(selectTarget(store.getState())).toBe(a);
    store.getState().pin(b);
    expect(selectTarget(store.getState())).toBe(b);
    expect(store.getState().hovered).toBeNull();
    store.getState().unpin();
    expect(selectTarget(store.getState())).toBeNull();
  });

  it('starts on the element tab and switches tabs', () => {
    const store = createInspectorStore();
    expect(store.getState().tab).toBe('element');
    store.getState().setTab('page');
    expect(store.getState().tab).toBe('page');
  });

  it('does not notify when the hovered element is unchanged', () => {
    const store = createInspectorStore();
    const a = element('a');
    store.getState().hover(a);
    let calls = 0;
    store.subscribe(() => (calls += 1));
    store.getState().hover(a);
    expect(calls).toBe(0);
  });
});
