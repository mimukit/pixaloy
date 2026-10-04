// Renders the Chrome Web Store graphics into store/: three 1280x800
// screenshots of the inspector on tests/e2e/fixtures/demo.html, and the
// 440x280 small promo tile from assets/promo-tile.html. Run with `pnpm screenshots`.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test as base, type Page } from '@playwright/test';
import { clickAction, expect, test } from '../e2e/fixtures';
import { FIXTURE_ORIGIN, fixtureUrl } from '../e2e/fixture-server';

const root = resolve(import.meta.dirname, '../..');
const SCREENSHOT = { width: 1280, height: 800 };
const PROMO = { width: 440, height: 280 };

function storePath(name: string): string {
  return resolve(root, 'store', name);
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function capture(page: Page, name: string, size: { width: number; height: number }) {
  const file = storePath(name);
  await page.screenshot({ path: file });
  expect(pngSize(file)).toEqual(size);
}

async function openDemo(page: Page) {
  await page.setViewportSize(SCREENSHOT);
  await page.goto(fixtureUrl('demo.html'));
}

test.describe('store screenshots', () => {
  test('1: hover overlay with the box model', async ({ context, serviceWorker }) => {
    const page = await context.newPage();
    await openDemo(page);
    expect(await clickAction(serviceWorker, page)).toBe('injected');
    // Inside the card's padding, so the overlay shows content, padding and border.
    const box = (await page.locator('#card-fair').boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await expect(page.locator('[data-pixaloy="label"]')).toBeVisible();
    await capture(page, 'screenshots/01-hover-box-model.png', SCREENSHOT);
  });

  test('2: pinned element with grouped styles and a copy toast', async ({
    context,
    serviceWorker,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: FIXTURE_ORIGIN,
    });
    const page = await context.newPage();
    await openDemo(page);
    await clickAction(serviceWorker, page);
    await page.locator('#start').click();
    await expect(page.locator('[data-pixaloy="pinned-tag"]')).toHaveText('a');
    await page.locator('[data-pixaloy="copy-css"]').click();
    await expect(page.locator('[data-pixaloy="toast"]')).toHaveText('CSS copied');
    await capture(page, 'screenshots/02-copy-element-css.png', SCREENSHOT);
  });

  test('3: page tab with colours and fonts', async ({ context, serviceWorker }) => {
    const page = await context.newPage();
    await openDemo(page);
    await clickAction(serviceWorker, page);
    await page.locator('#headline').click();
    await page.locator('[role="tab"]', { hasText: 'Page' }).click();
    await expect(page.locator('[data-pixaloy="page-tab"][data-status="done"]')).toBeVisible();
    // Scroll the panel so the fonts and the pinned element's type metrics show.
    await page.locator('[data-pixaloy="pinned-font"]').scrollIntoViewIfNeeded();
    await page.mouse.move(0, SCREENSHOT.height - 1);
    await capture(page, 'screenshots/03-page-colours-fonts.png', SCREENSHOT);
  });
});

base('promo tile', async ({ page }) => {
  await page.setViewportSize(PROMO);
  await page.goto(pathToFileURL(resolve(root, 'assets/promo-tile.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('img')).toHaveJSProperty('complete', true);
  await capture(page, 'promo-tile-440x280.png', PROMO);
});
