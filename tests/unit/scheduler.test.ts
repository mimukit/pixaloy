import { describe, expect, it, vi } from 'vitest';
import { idleSchedule, runChunked, type ChunkDeadline, type Schedule } from '../../src/engine';

/**
 * A scheduler the test steps by hand. A chunk keeps going while more than 1
 * unit is left, so each chunk fits `budget` visits.
 */
function fakeScheduler(budget: number) {
  const queue: Array<(deadline: ChunkDeadline) => void> = [];
  let cancelled = 0;
  const schedule: Schedule = (callback) => {
    queue.push(callback);
    return () => {
      const index = queue.indexOf(callback);
      if (index >= 0) queue.splice(index, 1);
      cancelled += 1;
    };
  };
  let remaining = 0;
  const deadline: ChunkDeadline = { didTimeout: false, timeRemaining: () => remaining };
  return {
    schedule,
    pending: () => queue.length,
    cancelled: () => cancelled,
    /** Run the next chunk with a fresh budget. */
    step() {
      remaining = budget + 1;
      const callback = queue.shift();
      if (!callback) throw new Error('nothing scheduled');
      callback(deadline);
    },
    /** A visit uses one unit of idle time. */
    spend: () => (remaining -= 1),
  };
}

describe('runChunked', () => {
  it('runs every item in chunks and reports progress', async () => {
    const scheduler = fakeScheduler(3);
    const seen: number[] = [];
    const progress: number[] = [];
    const task = runChunked(
      [1, 2, 3, 4, 5, 6, 7],
      (item) => {
        seen.push(item);
        scheduler.spend();
      },
      { schedule: scheduler.schedule, minPerChunk: 1, onProgress: (done) => progress.push(done) },
    );
    expect(seen).toEqual([]);
    scheduler.step();
    expect(seen).toEqual([1, 2, 3]);
    scheduler.step();
    expect(seen).toEqual([1, 2, 3, 4, 5, 6]);
    scheduler.step();
    expect(await task.done).toBe(true);
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(progress).toEqual([3, 6, 7]);
    expect(scheduler.pending()).toBe(0);
  });

  it('runs minPerChunk items even with no idle time left', () => {
    const scheduler = fakeScheduler(0);
    const seen: number[] = [];
    runChunked([1, 2, 3, 4, 5], (item) => seen.push(item), {
      schedule: scheduler.schedule,
      minPerChunk: 2,
    });
    scheduler.step();
    expect(seen).toEqual([1, 2]);
  });

  it('stops on cancel and resolves false', async () => {
    const scheduler = fakeScheduler(2);
    const seen: number[] = [];
    const task = runChunked(
      [1, 2, 3, 4, 5],
      (item) => {
        seen.push(item);
        scheduler.spend();
      },
      { schedule: scheduler.schedule, minPerChunk: 1 },
    );
    scheduler.step();
    task.cancel();
    expect(scheduler.pending()).toBe(0);
    expect(scheduler.cancelled()).toBe(1);
    expect(await task.done).toBe(false);
    expect(seen).toEqual([1, 2]);
  });

  it('rejects when a visit throws', async () => {
    const scheduler = fakeScheduler(5);
    const task = runChunked(
      [1],
      () => {
        throw new Error('boom');
      },
      { schedule: scheduler.schedule },
    );
    scheduler.step();
    await expect(task.done).rejects.toThrow('boom');
  });
});

describe('idleSchedule', () => {
  it('uses requestIdleCallback with a timeout when present', () => {
    const requestIdleCallback = vi.fn(() => 7);
    const cancelIdleCallback = vi.fn();
    const schedule = idleSchedule({
      requestIdleCallback,
      cancelIdleCallback,
      setTimeout: vi.fn(),
      clearTimeout: vi.fn(),
    });
    const cancel = schedule(() => {});
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 200 });
    cancel();
    expect(cancelIdleCallback).toHaveBeenCalledWith(7);
  });

  it('falls back to setTimeout with a time budget', () => {
    vi.useFakeTimers();
    try {
      const schedule = idleSchedule({ setTimeout, clearTimeout } as never);
      const deadlines: ChunkDeadline[] = [];
      schedule((deadline) => deadlines.push(deadline));
      expect(deadlines).toHaveLength(0);
      vi.runAllTimers();
      expect(deadlines).toHaveLength(1);
      expect(deadlines[0]!.timeRemaining()).toBeGreaterThan(0);

      const cancel = schedule(() => deadlines.push({} as ChunkDeadline));
      cancel();
      vi.runAllTimers();
      expect(deadlines).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
