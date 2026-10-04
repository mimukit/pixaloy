// Render the extension icons from assets/icon.svg into public/icon/<size>.png,
// where WXT finds them and lists them in the manifest. Run with `pnpm icons`.
//
// The 128 px icon is the store icon: 96x96 artwork centred with 16 px of
// transparent padding. The 16, 32 and 48 px toolbar sizes use the artwork at
// full bleed, so the mark stays legible at small sizes.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, type Page } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const svg = readFileSync(resolve(root, 'assets/icon.svg'), 'utf8');
const outDir = resolve(root, 'public/icon');

interface IconSpec {
  size: number;
  padding: number;
}

const ICONS: IconSpec[] = [
  { size: 16, padding: 0 },
  { size: 32, padding: 0 },
  { size: 48, padding: 0 },
  { size: 128, padding: 16 },
];

async function render(page: Page, { size, padding }: IconSpec): Promise<Buffer> {
  const art = size - padding * 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<!doctype html><html><head><style>
      html, body { margin: 0; background: transparent; }
      svg { display: block; position: absolute; left: ${padding}px; top: ${padding}px; width: ${art}px; height: ${art}px; }
    </style></head><body>${svg}</body></html>`,
  );
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

/** Decode `png` in the browser and return its size and the largest alpha in the padding band. */
async function inspect(
  page: Page,
  png: Buffer,
  padding: number,
): Promise<{ width: number; height: number; paddingAlpha: number }> {
  return page.evaluate(
    async ({ dataUrl, padding }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      let paddingAlpha = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const inside =
            x >= padding && x < width - padding && y >= padding && y < height - padding;
          if (!inside) paddingAlpha = Math.max(paddingAlpha, data[(y * width + x) * 4 + 3]!);
        }
      }
      return { width, height, paddingAlpha };
    },
    { dataUrl: `data:image/png;base64,${png.toString('base64')}`, padding },
  );
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const spec of ICONS) {
    const png = await render(page, spec);
    const check = await inspect(page, png, spec.padding);
    if (check.width !== spec.size || check.height !== spec.size) {
      throw new Error(`icon ${spec.size}: rendered ${check.width}x${check.height}`);
    }
    if (spec.padding > 0 && check.paddingAlpha !== 0) {
      throw new Error(
        `icon ${spec.size}: padding is not transparent (alpha ${check.paddingAlpha})`,
      );
    }
    const file = resolve(outDir, `${spec.size}.png`);
    writeFileSync(file, png);
    console.log(`wrote ${file}`);
  }
} finally {
  await browser.close();
}
