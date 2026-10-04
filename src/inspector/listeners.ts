type ListenerRecord = [
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | EventListenerOptions,
];

/**
 * Run `run` and record every listener it adds to `document`, so code that
 * never removes its own document listeners (React DOM's `selectionchange`) can
 * still be cleaned up. `release` removes the recorded listeners.
 *
 * The patch is an own property on this isolated world's `document` wrapper,
 * so the page never sees it, and it is removed before this function returns.
 */
export function captureDocumentListeners<T>(run: () => T): { result: T; release: () => void } {
  const records: ListenerRecord[] = [];
  const original = document.addEventListener;
  document.addEventListener = function (
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (!listener) return;
    records.push([type, listener, options]);
    original.call(this, type, listener, options);
  } as typeof document.addEventListener;

  try {
    const result = run();
    return {
      result,
      release: () => {
        for (const [type, listener, options] of records.splice(0)) {
          document.removeEventListener(type, listener, options);
        }
      },
    };
  } finally {
    delete (document as Partial<Pick<Document, 'addEventListener'>>).addEventListener;
  }
}
