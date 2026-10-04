/**
 * Runs a long loop in idle-time chunks, so a scan of a large page keeps the
 * main thread free for input and paint. The scheduler is injectable: tests
 * pass a fake and step it by hand.
 */

/** The part of `IdleDeadline` a chunk reads. */
export interface ChunkDeadline {
  timeRemaining(): number;
  readonly didTimeout: boolean;
}

/** Schedules one chunk and returns a function that cancels it. */
export type Schedule = (callback: (deadline: ChunkDeadline) => void) => () => void;

/** A chunk's time budget when `requestIdleCallback` is missing. */
export const FALLBACK_BUDGET_MS = 8;

/** The longest wait for an idle period before a chunk runs anyway. */
export const IDLE_TIMEOUT_MS = 200;

interface IdleScope {
  requestIdleCallback?: (
    callback: (deadline: ChunkDeadline) => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (callback: () => void, ms: number) => unknown;
  clearTimeout: (handle: never) => void;
}

/**
 * `requestIdleCallback` with a timeout, or a `setTimeout(0)` chunk with an
 * {@link FALLBACK_BUDGET_MS} budget where the browser has no idle callback.
 */
export function idleSchedule(scope: IdleScope = globalThis as unknown as IdleScope): Schedule {
  const { requestIdleCallback, cancelIdleCallback } = scope;
  if (typeof requestIdleCallback === 'function' && typeof cancelIdleCallback === 'function') {
    return (callback) => {
      const handle = requestIdleCallback.call(scope, callback, { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback.call(scope, handle);
    };
  }
  return (callback) => {
    const handle = scope.setTimeout.call(
      scope,
      () => {
        const start = performance.now();
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, FALLBACK_BUDGET_MS - (performance.now() - start)),
        });
      },
      0,
    );
    return () => scope.clearTimeout.call(scope, handle as never);
  };
}

export interface ChunkedOptions {
  schedule: Schedule;
  /** The item count, for progress. */
  total?: number;
  /** Called after each chunk with the items done so far. */
  onProgress?: (done: number, total: number | undefined) => void;
  /**
   * Items a chunk always runs, even with no idle time left (after the idle
   * timeout fires), so the loop always moves forward.
   */
  minPerChunk?: number;
}

export interface ChunkedTask {
  /** Resolves true when every item ran, false when cancelled. Rejects if `visit` throws. */
  done: Promise<boolean>;
  cancel: () => void;
}

/** Call `visit` on each item, a chunk per scheduled callback. */
export function runChunked<T>(
  items: Iterable<T>,
  visit: (item: T) => void,
  { schedule, total, onProgress, minPerChunk = 50 }: ChunkedOptions,
): ChunkedTask {
  const iterator = items[Symbol.iterator]();
  let processed = 0;
  let cancelled = false;
  let cancelPending: (() => void) | null = null;
  let settle: (complete: boolean) => void = () => {};
  let fail: (error: unknown) => void = () => {};

  const done = new Promise<boolean>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });

  const chunk = (deadline: ChunkDeadline) => {
    cancelPending = null;
    if (cancelled) return;
    try {
      let ran = 0;
      while (ran < minPerChunk || deadline.timeRemaining() > 1) {
        const next = iterator.next();
        if (next.done) {
          onProgress?.(processed, total);
          settle(true);
          return;
        }
        visit(next.value);
        processed += 1;
        ran += 1;
      }
      onProgress?.(processed, total);
      cancelPending = schedule(chunk);
    } catch (error) {
      cancelled = true;
      fail(error);
    }
  };

  cancelPending = schedule(chunk);

  return {
    done,
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      cancelPending?.();
      cancelPending = null;
      settle(false);
    },
  };
}
