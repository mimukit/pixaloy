import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { InspectorActions, InspectorState, InspectorStore } from '../inspector/store';

export const InspectorStoreContext = createContext<InspectorStore | null>(null);

/** Read a slice of the inspector store from a component. */
export function useInspector<T>(selector: (state: InspectorState & InspectorActions) => T): T {
  const store = useContext(InspectorStoreContext);
  if (!store) throw new Error('useInspector needs an InspectorStoreContext provider.');
  return useStore(store, selector);
}
