import type { Page } from '@playwright/test';
import { clickAction, expect, readActionState, test } from './fixtures';
import { fixtureUrl } from './fixture-server';

const HOST = 'pixaloy-inspector';

/** Playwright locators pierce the open shadow root. */
function inspector(page: Page) {
  return {
    host: page.locator(HOST),
    label: page.locator('[data-pixaloy="label"]'),
    tag: page.locator('[data-pixaloy="tag"]'),
    classes: page.locator('[data-pixaloy="classes"]'),
    size: page.locator('[data-pixaloy="size"]'),
    pinnedTag: page.locator('[data-pixaloy="pinned-tag"]'),
    panel: page.locator('[data-pixaloy="panel"]'),
  };
}

/** Hover a page element, at its centre or at an offset from its top-left corner. */
async function hover(page: Page, selector: string, offset?: { x: number; y: number }) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`${selector} has no box`);
  const point = offset ?? { x: box.width / 2, y: box.height / 2 };
  await page.mouse.move(box.x + point.x, box.y + point.y);
}

/** Inside the padding of a `.card` (4 px border, 12 px padding). */
const CARD_PADDING = { x: 8, y: 8 };

/** The id of the element the overlay outlines, matched by its border box. */
async function outlinedId(page: Page): Promise<string | null> {
  return page.evaluate((hostTag) => {
    const host = document.querySelector(hostTag);
    const outline = host?.shadowRoot?.querySelector<HTMLElement>('[data-box="border"]');
    if (!outline) return null;
    const box = outline.getBoundingClientRect();
    const match = Array.from(document.querySelectorAll('[id]')).find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        Math.abs(rect.left - box.left) < 1 &&
        Math.abs(rect.top - box.top) < 1 &&
        Math.abs(rect.width - box.width) < 1 &&
        Math.abs(rect.height - box.height) < 1
      );
    });
    return match?.id ?? null;
  }, HOST);
}

/**
 * The event listeners the extension's isolated world has on `window` and
 * `document`, read through CDP. Listeners in that world are invisible to the
 * page and to `getEventListeners` in the main world.
 */
async function pixaloyListeners(page: Page): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  const worlds: number[] = [];
  cdp.on('Runtime.executionContextCreated', ({ context }) => {
    if (context.name === 'Pixaloy') worlds.push(context.id);
  });
  await cdp.send('Runtime.enable');
  const types: string[] = [];
  for (const contextId of worlds) {
    for (const expression of ['window', 'document']) {
      const { result } = await cdp.send('Runtime.evaluate', { expression, contextId });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', {
        objectId: result.objectId!,
      });
      types.push(...listeners.map((listener) => `${expression}:${listener.type}`));
    }
  }
  await cdp.detach();
  return types;
}

/** Node names of the top layer, bottom to top, read through CDP. */
async function topLayer(page: Page): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeIds } = await cdp.send('DOM.getTopLayerElements');
  const names: string[] = [];
  for (const nodeId of nodeIds) {
    const { node } = await cdp.send('DOM.describeNode', { nodeId });
    names.push(node.nodeName.toLowerCase());
  }
  await cdp.detach();
  return names.filter((name) => name !== '::backdrop');
}

test.describe('inspector core', () => {
  test('action click injects; hover, pin, arrows, Esc unpin then exit with full teardown', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('index.html'));
    const ui = inspector(page);

    // Toolbar click (through the service worker) injects the inspector.
    expect(await clickAction(serviceWorker, page)).toBe('injected');
    await expect(ui.host).toHaveCount(1);
    expect(await pixaloyListeners(page)).toEqual(
      expect.arrayContaining(['window:click', 'window:keydown', 'window:pointermove']),
    );
    expect(await ui.host.evaluate((host) => host.matches(':popover-open'))).toBe(true);
    expect(await ui.host.getAttribute('popover')).toBe('manual');
    await expect(ui.panel).toBeVisible();

    // Hover draws the box model, the tag, the classes and the size.
    await hover(page, '#first', CARD_PADDING);
    await expect(ui.tag).toHaveText('div');
    await expect(ui.classes).toHaveText('.card.first');
    // 300 px content + 2 × 12 px padding + 2 × 4 px border.
    await expect(ui.size).toHaveText(/^332 × \d+/);
    for (const band of ['margin', 'border', 'padding', 'content']) {
      await expect(page.locator(`[data-box="${band}"]`)).toHaveCount(1);
    }
    const bands = await page.evaluate((hostTag) => {
      const root = document.querySelector(hostTag)!.shadowRoot!;
      const rect = (band: string) =>
        root.querySelector(`[data-box="${band}"]`)!.getBoundingClientRect();
      return {
        margin: rect('margin').width,
        border: rect('border').width,
        padding: rect('padding').width,
        content: rect('content').width,
      };
    }, HOST);
    expect(bands).toEqual({ margin: 372, border: 332, padding: 324, content: 300 });
    expect(await outlinedId(page)).toBe('first');

    // Click pins, and the page does not get the click.
    await page.locator('#counter').click();
    await expect(ui.pinnedTag).toHaveText('button');
    await expect(page.locator('#counter')).toHaveText('Clicked 0');
    expect(
      await page.evaluate(() => (window as unknown as { pageClicks: number }).pageClicks),
    ).toBe(0);

    // Hovering elsewhere does not move the pinned outline.
    await hover(page, '#third', CARD_PADDING);
    expect(await outlinedId(page)).toBe('counter');

    // Arrow keys: Up → parent, Right → next sibling, Left → previous, Down → first child.
    await page.keyboard.press('ArrowUp');
    expect(await outlinedId(page)).toBe('second');
    await page.keyboard.press('ArrowRight');
    expect(await outlinedId(page)).toBe('third');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    expect(await outlinedId(page)).toBe('first');
    await page.keyboard.press('ArrowDown');
    expect(await outlinedId(page)).toBe('title');
    await expect(ui.pinnedTag).toHaveText('h2');

    // Esc unpins first; the inspector stays.
    await page.keyboard.press('Escape');
    await expect(ui.pinnedTag).toHaveCount(0);
    await expect(ui.host).toHaveCount(1);

    // Esc with nothing pinned exits and removes everything.
    await page.keyboard.press('Escape');
    await expect(ui.host).toHaveCount(0);
    expect(await page.evaluate(() => document.querySelectorAll('[popover]').length)).toBe(0);
    expect(await pixaloyListeners(page)).toEqual([]);

    // Page clicks reach the page again.
    await page.locator('#counter').click();
    await expect(page.locator('#counter')).toHaveText('Clicked 1');
    expect(
      await page.evaluate(() => (window as unknown as { pageClicks: number }).pageClicks),
    ).toBe(1);
  });

  test('a second action click removes the inspector, and a third injects it again', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('index.html'));
    const ui = inspector(page);

    expect(await clickAction(serviceWorker, page)).toBe('injected');
    await expect(ui.host).toHaveCount(1);
    await page.locator('#text').click();
    await expect(ui.pinnedTag).toHaveText('p');

    expect(await clickAction(serviceWorker, page)).toBe('removed');
    await expect(ui.host).toHaveCount(0);
    expect(await pixaloyListeners(page)).toEqual([]);
    await page.locator('#counter').click();
    await expect(page.locator('#counter')).toHaveText('Clicked 1');

    expect(await clickAction(serviceWorker, page)).toBe('injected');
    await expect(ui.host).toHaveCount(1);
    await hover(page, '#title');
    await expect(ui.tag).toHaveText('h2');
  });

  test('the inspector ignores its own host when hit-testing', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('index.html'));
    const ui = inspector(page);
    await clickAction(serviceWorker, page);
    await hover(page, '#first', CARD_PADDING);
    await expect(ui.tag).toHaveText('div');

    // Moving over the panel keeps the page outline: the host is never a hover target.
    const panelBox = (await ui.panel.boundingBox())!;
    await page.mouse.move(panelBox.x + 20, panelBox.y + panelBox.height - 10);
    await page.waitForTimeout(100);
    await expect(ui.tag).toHaveText('div');
    expect(await outlinedId(page)).toBe('first');

    // Click on the panel: the panel handles it, nothing gets pinned.
    await ui.panel.locator('[role="tab"]', { hasText: 'Page' }).click();
    await expect(page.locator('[data-pixaloy="page-tab"]')).toBeVisible();
    await ui.panel.locator('[role="tab"]', { hasText: 'Element' }).click();
    await expect(ui.pinnedTag).toHaveCount(0);

    // The close button exits.
    await page.locator('[data-pixaloy="close"]').click();
    await expect(ui.host).toHaveCount(0);
  });

  test('the overlay stays above a modal dialog the page opens later', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('dialog.html'));
    const ui = inspector(page);

    expect(await clickAction(serviceWorker, page)).toBe('injected');
    await expect(ui.host).toHaveCount(1);

    // The page opens a modal dialog after the inspector: it enters the top layer above the host.
    await page.evaluate(() => (document.getElementById('modal') as HTMLDialogElement).showModal());
    await expect(page.locator('#modal')).toHaveJSProperty('open', true);

    // The inspector moved back above the dialog: it is the last (topmost) top-layer element.
    // elementFromPoint cannot show this: a modal dialog makes the rest of the page,
    // the host included, inert, and hit testing skips inert nodes.
    await expect.poll(() => topLayer(page)).toEqual(['dialog', HOST]);
    expect(await ui.host.evaluate((host) => host.matches(':popover-open'))).toBe(true);

    // A popover the page opens later goes below the inspector too.
    await page.evaluate(() => {
      const tip = document.createElement('div');
      tip.id = 'tip';
      tip.popover = 'manual';
      tip.textContent = 'Page popover';
      document.getElementById('modal')!.append(tip);
      tip.showPopover();
    });
    await expect.poll(() => topLayer(page)).toEqual(['dialog', 'div', HOST]);

    // Hover inside the dialog draws the overlay.
    await hover(page, '#dialog-title');
    await expect(ui.tag).toHaveText('h2');
    expect(await outlinedId(page)).toBe('dialog-title');
  });

  test('an already open modal dialog stays below the injected inspector', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('dialog.html#open'));
    await expect(page.locator('#modal')).toHaveJSProperty('open', true);
    const ui = inspector(page);

    await clickAction(serviceWorker, page);
    await expect(ui.panel).toBeVisible();
    expect(await topLayer(page)).toEqual(['dialog', HOST]);
  });

  test('a restricted page gets a ! badge and a reason for 3 s', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto('chrome://version');

    expect(await clickAction(serviceWorker, page)).toBe('failed');
    const failed = await readActionState(serviceWorker);
    expect(failed.text).toBe('!');
    expect(failed.title).toMatch(/^Pixaloy cannot inspect this page: .+/);

    await expect
      .poll(() => readActionState(serviceWorker), { timeout: 6000, intervals: [500] })
      .toEqual({ text: '', title: 'Pixaloy: inspect this page' });
  });
});
