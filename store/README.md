# Store files

The text for the Chrome Web Store listing of Pixaloy. Each file fills one or more fields in the CWS Developer Dashboard. The steps that use them are in [`docs/release.md`](../docs/release.md).

| File | Dashboard tab | Field |
|------|---------------|-------|
| [`listing.md`](listing.md) | Store listing | Item name, category, language, homepage URL, support URL, privacy policy URL |
| [`description.txt`](description.txt) | Store listing | Summary. The dashboard reads it from the manifest `description` in the zip, so this file is a copy for review. It must match `wxt.config.ts` exactly. |
| [`detailed-description.txt`](detailed-description.txt) | Store listing | Description |
| [`single-purpose.md`](single-purpose.md) | Privacy | Single purpose description |
| [`permissions.md`](permissions.md) | Privacy | Permission justification for `activeTab`, `scripting` and `storage`, the remote code answer, and data usage |
| [`../docs/privacy/index.md`](../docs/privacy/index.md) | Privacy | Privacy policy URL, served at https://mimukit.github.io/pixaloy/privacy/ |

## Graphic assets

| File | Dashboard tab | Field | Source |
|------|---------------|-------|--------|
| [`screenshots/01-hover-box-model.png`](screenshots/01-hover-box-model.png) | Store listing | Screenshots (1280x800) | `tests/screenshots/store.spec.ts` on `tests/e2e/fixtures/demo.html` |
| [`screenshots/02-copy-element-css.png`](screenshots/02-copy-element-css.png) | Store listing | Screenshots (1280x800) | Same |
| [`screenshots/03-page-colours-fonts.png`](screenshots/03-page-colours-fonts.png) | Store listing | Screenshots (1280x800) | Same |
| [`promo-tile-440x280.png`](promo-tile-440x280.png) | Store listing | Small promo tile | `assets/promo-tile.html` |
| [`../public/icon/128.png`](../public/icon/128.png) | Store listing | Store icon (128x128) | `assets/icon.svg` |

`pnpm screenshots` builds the E2E build and writes the three screenshots and the promo tile. It checks the size of each file. `pnpm icons` renders `public/icon/16.png`, `32.png`, `48.png` and `128.png` from `assets/icon.svg`. WXT lists them in the manifest. The 128 px icon has 96x96 artwork with 16 px of transparent padding, and the script checks that the padding is transparent. Run either command again after you change the source, and commit the new PNG files. CI does not run them.
