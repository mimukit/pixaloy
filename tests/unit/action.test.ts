import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { handleActionClick } from '../../src/background/action';

const tab = { id: 7 } as Parameters<typeof handleActionClick>[0];

/** `executeScript` has overloads; spy on it as a plain async function. */
function spyExecuteScript(): MockInstance<(injection: unknown) => Promise<unknown>> {
  return vi.spyOn(fakeBrowser.scripting, 'executeScript') as unknown as MockInstance<
    (injection: unknown) => Promise<unknown>
  >;
}

describe('handleActionClick', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    vi.useFakeTimers();
    vi.spyOn(fakeBrowser.runtime, 'getManifest').mockReturnValue({
      manifest_version: 3,
      name: 'Pixaloy',
      version: '0.1.0',
      action: { default_title: 'Pixaloy: inspect this page' },
    });
    vi.spyOn(fakeBrowser.action, 'setTitle').mockResolvedValue();
    vi.spyOn(fakeBrowser.action, 'setBadgeBackgroundColor').mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('injects the inspector file when none is running', async () => {
    const execute = spyExecuteScript()
      .mockResolvedValueOnce([{ frameId: 0, documentId: 'd', result: false }])
      .mockResolvedValueOnce([]);
    await expect(handleActionClick(tab)).resolves.toBe('injected');
    expect(execute).toHaveBeenLastCalledWith({
      target: { tabId: 7 },
      files: ['/content-scripts/inspector.js'],
    });
  });

  it('removes a running inspector instead of injecting again', async () => {
    const execute = spyExecuteScript().mockResolvedValueOnce([
      { frameId: 0, documentId: 'd', result: true },
    ]);
    await expect(handleActionClick(tab)).resolves.toBe('removed');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('shows a ! badge and the reason on a restricted page, and clears both after 3 s', async () => {
    spyExecuteScript().mockRejectedValue(new Error('Cannot access a chrome:// URL'));
    const setTitle = vi.mocked(fakeBrowser.action.setTitle);

    await expect(handleActionClick(tab)).resolves.toBe('failed');
    expect(await fakeBrowser.action.getBadgeText({ tabId: 7 })).toBe('!');
    expect(setTitle).toHaveBeenLastCalledWith({
      tabId: 7,
      title: 'Pixaloy cannot inspect this page: Cannot access a chrome:// URL',
    });

    await vi.advanceTimersByTimeAsync(2999);
    expect(await fakeBrowser.action.getBadgeText({ tabId: 7 })).toBe('!');
    await vi.advanceTimersByTimeAsync(1);
    expect(await fakeBrowser.action.getBadgeText({ tabId: 7 })).toBe('');
    expect(setTitle).toHaveBeenLastCalledWith({ tabId: 7, title: 'Pixaloy: inspect this page' });
  });
});
