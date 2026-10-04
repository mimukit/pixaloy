import type { Page } from '@playwright/test';
import { clickAction, expect, test } from './fixtures';
import { FIXTURE_ORIGIN, fixtureUrl } from './fixture-server';

const HOST = 'pixaloy-inspector';

function pageTab(page: Page) {
  return {
    tab: page.locator('[role="tab"]', { hasText: 'Page' }),
    done: page.locator('[data-pixaloy="page-tab"][data-status="done"]'),
    colour: (key: string) => page.locator(`[data-pixaloy="colour"][data-key="${key}"]`),
    fonts: page.locator('[data-pixaloy="font"]'),
    toast: page.locator('[data-pixaloy="toast"]'),
    pinnedFont: (property: string) =>
      page.locator(`[data-pixaloy="pinned-font"] dd[data-property="${property}"]`),
  };
}

/** The listed colours as `{ key: count }`. */
function listedColours(page: Page): Promise<Record<string, number>> {
  return page
    .locator('[data-pixaloy="colour"]')
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((row) => [
          row.getAttribute('data-key')!,
          Number(row.querySelector('[data-pixaloy="colour-count"]')!.textContent),
        ]),
      ),
    );
}

function listedFonts(page: Page): Promise<Record<string, number>> {
  return page
    .locator('[data-pixaloy="font"]')
    .evaluateAll((rows) =>
      Object.fromEntries(
        rows.map((row) => [
          row.querySelector('[data-pixaloy="font-value"]')!.textContent!,
          Number(row.querySelector('[data-pixaloy="font-count"]')!.textContent),
        ]),
      ),
    );
}

test.describe('page tab', () => {
  test('lists the fixture colours and fonts with exact counts, and copies them', async ({
    context,
    serviceWorker,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: FIXTURE_ORIGIN,
    });
    const page = await context.newPage();
    await page.goto(fixtureUrl('palette.html'));
    expect(await clickAction(serviceWorker, page)).toBe('injected');
    const ui = pageTab(page);

    // Pin the heading, so the tab shows its type metrics.
    await page.locator('#title').click();
    await ui.tab.click();
    await expect(ui.done).toBeVisible();

    expect(await listedColours(page)).toEqual({
      // body, h1, p, svg, rect
      'rgba(17, 17, 17, 1)': 5,
      // button background, its four borders, the link
      'rgba(0, 102, 204, 1)': 6,
      // p top border, button outline, rect fill
      'rgba(255, 0, 0, 1)': 3,
      // body background, button text
      'rgba(255, 255, 255, 1)': 2,
      // html
      'rgba(0, 0, 0, 1)': 1,
    });
    expect(await listedFonts(page)).toEqual({
      'Arial, sans-serif': 2,
      'Georgia, serif': 1,
      'system-ui': 1,
    });
    await expect(page.locator('[data-pixaloy="colour"]').first()).toHaveAttribute(
      'data-key',
      'rgba(0, 102, 204, 1)',
    );

    const blue = ui.colour('rgba(0, 102, 204, 1)');
    await expect(blue.locator('[data-format="oklch"]')).toHaveText(/^oklch\(/);
    await blue.locator('[data-format="hex"]').click();
    await expect(ui.toast).toHaveText('Colour copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('#0066cc');

    await ui.fonts.first().locator('[data-pixaloy="font-value"]').click();
    await expect(ui.toast).toHaveText('Font copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Arial, sans-serif');

    await expect(ui.pinnedFont('font-size')).toHaveText('32px');
    await expect(ui.pinnedFont('font-weight')).toHaveText('700');
  });

  test('scans 10,000 elements in idle chunks without blocking the page', async ({
    context,
    serviceWorker,
  }) => {
    const page = await context.newPage();
    await page.goto(fixtureUrl('many.html'));
    await page.evaluate(() => {
      const colours = ['rgb(200, 0, 0)', 'rgb(0, 200, 0)', 'rgb(0, 0, 200)', 'rgb(200, 200, 0)'];
      const root = document.getElementById('many')!;
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < 10_000; index += 1) {
        const div = document.createElement('div');
        div.style.backgroundColor = colours[index % colours.length]!;
        fragment.append(div);
      }
      root.append(fragment);
    });
    expect(await clickAction(serviceWorker, page)).toBe('injected');
    await expect(page.locator('[data-pixaloy="panel"]')).toBeVisible();

    // Watch the main thread from the page: long tasks and the largest gap
    // between 10 ms interval ticks.
    await page.evaluate(() => {
      const scope = window as unknown as { maxTask: number; maxGap: number };
      scope.maxTask = 0;
      scope.maxGap = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          scope.maxTask = Math.max(scope.maxTask, entry.duration);
        }
      }).observe({ type: 'longtask' });
      let last = performance.now();
      setInterval(() => {
        const now = performance.now();
        scope.maxGap = Math.max(scope.maxGap, now - last);
        last = now;
      }, 10);
    });

    // Click the tab and wait for the result from the page itself: a Playwright
    // locator walks every shadow root of the 10,000-element page on each poll,
    // which would block the main thread and spoil the measurement.
    await page.evaluate((hostTag) => {
      const tabs = document.querySelector(hostTag)!.shadowRoot!.querySelectorAll('[role="tab"]');
      [...tabs]
        .find((tab) => tab.textContent === 'Page')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    }, HOST);
    await page.waitForFunction(
      (hostTag) =>
        document
          .querySelector(hostTag)!
          .shadowRoot!.querySelector('[data-pixaloy="page-tab"][data-status="done"]') !== null,
      HOST,
      { polling: 100, timeout: 30_000 },
    );
    const { maxTask, maxGap } = await page.evaluate(() => {
      const { maxTask, maxGap } = window as unknown as { maxTask: number; maxGap: number };
      return { maxTask, maxGap };
    });
    console.log(`page scan: longest task ${maxTask} ms, longest heartbeat gap ${maxGap} ms`);
    expect(maxTask).toBeLessThan(200);
    expect(maxGap).toBeLessThan(200);

    // html, body, #many and the 10,000 rows. head and its children do not render.
    await expect(page.locator('[data-pixaloy="page-summary"]')).toContainText(
      '10003 visible elements',
    );
    const colours = await listedColours(page);
    expect(colours['rgba(17, 17, 17, 1)']).toBe(10_002);
    expect(colours['rgba(200, 0, 0, 1)']).toBe(2500);
    expect(colours['rgba(0, 0, 200, 1)']).toBe(2500);
  });
});
