import { createStore, type StoreApi } from 'zustand/vanilla';

/** Panel tabs. Phase 3 fills `element`; Phase 4 fills `page`. */
export type PanelTab = 'element' | 'page';

export interface InspectorState {
  /** The element under the pointer, when nothing is pinned. */
  hovered: Element | null;
  /** The element the user clicked or moved to with the arrow keys. */
  pinned: Element | null;
  /** The visible panel tab. */
  tab: PanelTab;
  /** Bumped on scroll and resize, so the overlay measures the target again. */
  layoutVersion: number;
}

export interface InspectorActions {
  hover: (element: Element | null) => void;
  pin: (element: Element) => void;
  unpin: () => void;
  setTab: (tab: PanelTab) => void;
  bumpLayout: () => void;
}

export type InspectorStore = StoreApi<InspectorState & InspectorActions>;

export const initialInspectorState: InspectorState = {
  hovered: null,
  pinned: null,
  tab: 'element',
  layoutVersion: 0,
};

/**
 * One store per inspector session. Plain zustand (no React), so the
 * controller drives it and React only reads it. Later phases add their own
 * fields and actions here.
 */
export function createInspectorStore(): InspectorStore {
  return createStore<InspectorState & InspectorActions>()((set) => ({
    ...initialInspectorState,
    hover: (hovered) => set((state) => (state.hovered === hovered ? state : { hovered })),
    pin: (pinned) => set({ pinned, hovered: null }),
    unpin: () => set({ pinned: null }),
    setTab: (tab) => set({ tab }),
    bumpLayout: () => set((state) => ({ layoutVersion: state.layoutVersion + 1 })),
  }));
}

/** The element the overlay outlines: the pinned one, else the hovered one. */
export function selectTarget(state: InspectorState): Element | null {
  return state.pinned ?? state.hovered;
}
