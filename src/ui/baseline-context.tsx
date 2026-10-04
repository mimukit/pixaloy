import { createContext, useContext } from 'react';
import type { BaselineProvider } from '../engine';

export const BaselineContext = createContext<BaselineProvider | null>(null);

/** The style baseline of this inspector session (the hidden iframe). */
export function useBaseline(): BaselineProvider {
  const baseline = useContext(BaselineContext);
  if (!baseline) throw new Error('useBaseline needs a BaselineContext provider.');
  return baseline;
}
