import type { Page } from '@playwright/test';
import { clickAction, expect, test } from './fixtures';
import { FIXTURE_ORIGIN, fixtureUrl } from './fixture-server';

const HOST = 'pixaloy-inspector';

function panel(page: Page) {
  return {
    pinnedTag: page.locator('[data-pixaloy="pinned-tag"]'),
    copyCss: page.locator('[data-pixaloy="copy-css"]'),
    copySelector: page.locator('[data-pixaloy="copy-selector"]'),
    toast: page.locator('[data-pixaloy="toast"]'),
    fallback: page.locator('[data-pixaloy="copy-fallback-text"]'),
    row: (property: string) =>
      page.locator(`[data-pixaloy="style-row"][data-property="${property}"]`),
    group: (id: string) => page.locator(`[data-pixaloy="style-group"][data-group="${id}"]`),
  };
}

function readClipboard(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

/** Pin `#card` on a strict-CSP fixture: click its text, then move to the parent. */
async function pinCard(page: Page) {
  await page.locator('#card p').click();
  await page.keyboard.press('ArrowUp');
  await expect(panel(page).pinnedTag).toHaveText('div');
}

test.describe('element panel and copy', () => {
  test('under a strict CSP, copy CSS keeps box-sizing and collapses the shorthands', async ({
    context,
    serviceWorker,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: FIXTURE_ORIGIN,
    });
    const page = await context.newPage();
    await page.goto(fixtureUrl('strict.html'));
    expect(await clickAction(serviceWorker, page)).toBe('injected');
    const ui = panel(page);
    await pinCard(page);

    // The five groups, with values from getComputedStyle.
    for (const id of ['layout', 'box', 'typography', 'colour', 'effects']) {
      await expect(ui.group(id)).toHaveCount(1);
    }
    await expect(ui.row('box-sizing')).toContainText('border-box');

    await ui.copyCss.click();
    await expect(ui.toast).toHaveText('CSS copied');
    const css = await readClipboard(page);
    expect(css).toContain('box-sizing: border-box;');
    expect(css).toContain('width: 320px;');
    expect(css).toContain('margin: 8px;');
    expect(css).toContain('padding: 4px 8px;');
    expect(css).toContain('border: 2px solid rgb(200, 0, 0);');
    expect(css).toContain('border-radius: 6px;');
    expect(css).toContain('background-color: rgb(240, 240, 255);');
    // Inherited values stay: the copy is standalone.
    expect(css).toContain('font-family: sans-serif;');
    expect(css).toContain('color: rgb(30, 30, 30);');
    expect(css).toContain('line-height: 24px;');
    // A div's UA defaults drop.
    expect(css).not.toContain('display:');
    expect(css).not.toContain('margin-top');
    for (const line of css.split('\n')) expect(line).toMatch(/^[a-z-]+: .+;$/);

    // The baseline iframe: in the shadow root, no src, standards mode.
    const frame = await page.evaluate((hostTag) => {
      const iframe = document
        .querySelector(hostTag)!
        .shadowRoot!.querySelector<HTMLIFrameElement>('iframe[data-pixaloy-baseline]')!;
      return {
        hasSrc: iframe.hasAttribute('src'),
        compatMode: iframe.contentDocument!.compatMode,
        inShadowRoot: iframe.getRootNode() !== document,
      };
    }, HOST);
    expect(frame).toEqual({ hasSrc: false, compatMode: 'CSS1Compat', inShadowRoot: true });

    // Collapsed gap and overflow on the flex row.
    await page.keyboard.press('ArrowRight');
    await ui.copyCss.click();
    await expect.poll(() => readClipboard(page)).toContain('gap: 12px;');
    expect(await readClipboard(page)).toContain('overflow: hidden;');
  });

  test('copy selector round-trips, skips hashed classes, and a row copies one value', async ({
    context,
    serviceWorker,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: FIXTURE_ORIGIN,
    });
    const page = await context.newPage();
    await page.goto(fixtureUrl('strict.html'));
    await clickAction(serviceWorker, page);
    const ui = panel(page);

    await page.getByRole('button', { name: 'Two' }).click();
    await expect(ui.pinnedTag).toHaveText('button');
    await ui.copySelector.click();
    await expect(ui.toast).toHaveText('Selector copied');
    const selector = await readClipboard(page);
    expect(selector).not.toMatch(/jsx-|css-|sc-/);
    expect(
      await page.evaluate(
        (copied) => document.querySelector(copied)?.textContent ?? null,
        selector,
      ),
    ).toBe('Two');

    await pinCard(page);
    await ui.copySelector.click();
    const cardSelector = await expect
      .poll(() => readClipboard(page))
      .not.toBe(selector)
      .then(() => readClipboard(page));
    expect(cardSelector).not.toContain('css-1x2y3z');
    expect(await page.evaluate((copied) => document.querySelector(copied)?.id, cardSelector)).toBe(
      'card',
    );

    await ui.row('border-top-left-radius').click();
    await expect(ui.toast).toHaveText('Value copied');
    expect(await readClipboard(page)).toBe('6px');
  });

  test('a blocked clipboard shows the text in a selected box', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('blocked-clipboard.html'));
    await clickAction(serviceWorker, page);
    const ui = panel(page);
    await pinCard(page);

    await ui.copyCss.click();
    await expect(ui.fallback).toBeVisible();
    await expect(ui.toast).toHaveCount(0);
    const box = await ui.fallback.evaluate((node) => {
      const area = node as HTMLTextAreaElement;
      return {
        value: area.value,
        selected: area.selectionStart === 0 && area.selectionEnd === area.value.length,
        readOnly: area.readOnly,
      };
    });
    expect(box.value).toContain('box-sizing: border-box;');
    expect(box.selected).toBe(true);
    expect(box.readOnly).toBe(true);
  });
});
