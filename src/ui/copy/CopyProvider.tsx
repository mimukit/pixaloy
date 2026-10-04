import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { writeClipboard } from './clipboard';

/** How long the toast stays. */
export const TOAST_MS = 1800;

interface Toast {
  id: number;
  message: string;
}

interface Fallback {
  label: string;
  text: string;
}

interface CopyState {
  /** Copy `text`, then confirm with a toast or show the fallback box. `label` names it: "CSS", "Selector". */
  copy: (text: string, label: string) => Promise<boolean>;
  toast: Toast | null;
  fallback: Fallback | null;
  dismissFallback: () => void;
}

const CopyContext = createContext<CopyState | null>(null);

/** Holds the copy toast and the blocked-clipboard box for the whole panel. */
export function CopyProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [fallback, setFallback] = useState<Fallback | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const copy = useCallback(async (text: string, label: string) => {
    const copied = await writeClipboard(text);
    if (copied) {
      setFallback(null);
      setToast((previous) => ({ id: (previous?.id ?? 0) + 1, message: `${label} copied` }));
    } else {
      setFallback({ label, text });
    }
    return copied;
  }, []);

  const dismissFallback = useCallback(() => setFallback(null), []);
  const value = useMemo(
    () => ({ copy, toast, fallback, dismissFallback }),
    [copy, toast, fallback, dismissFallback],
  );
  return <CopyContext value={value}>{children}</CopyContext>;
}

function useCopyState(): CopyState {
  const state = useContext(CopyContext);
  if (!state) throw new Error('useCopy needs a CopyProvider.');
  return state;
}

/** The copy action for any panel component: `copy(text, label)`. */
export function useCopy(): CopyState['copy'] {
  return useCopyState().copy;
}

/** The toast that confirms a copy. */
export function CopyToast() {
  const { toast } = useCopyState();
  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <div
        key={toast.id}
        role="status"
        data-pixaloy="toast"
        className="rounded-sm bg-ink px-3 py-1 text-sm text-white shadow-panel"
      >
        {toast.message}
      </div>
    </div>
  );
}

/** When the page blocks the clipboard: the text in a selected box, ready for Ctrl+C. */
export function CopyFallback() {
  const { fallback, dismissFallback } = useCopyState();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const text = fallback?.text;
  useEffect(() => {
    textRef.current?.focus();
    textRef.current?.select();
  }, [text]);
  if (!fallback) return null;
  return (
    <div data-pixaloy="copy-fallback" className="flex flex-col gap-1 border-b border-line p-2">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted">
          This page blocks the clipboard. Press Ctrl+C (⌘C) to copy the{' '}
          {fallback.label.toLowerCase()}.
        </p>
        <button
          type="button"
          aria-label="Close"
          onClick={dismissFallback}
          className="ml-auto rounded-sm px-1 text-sm text-muted hover:bg-hover"
        >
          ✕
        </button>
      </div>
      <textarea
        readOnly
        data-pixaloy="copy-fallback-text"
        value={fallback.text}
        rows={Math.min(6, fallback.text.split('\n').length)}
        ref={textRef}
        className="w-full resize-none rounded-sm border border-line bg-hover p-1 font-mono text-xs"
      />
    </div>
  );
}
