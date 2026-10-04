# Store listing

Values for the Chrome Web Store dashboard, Store listing tab.

| Field | Value |
|-------|-------|
| Item name | Pixaloy: CSS Inspector and Style Copier |
| Summary | The manifest `description`. Text in [`description.txt`](description.txt). The dashboard reads it from the uploaded zip. |
| Description | Text in [`detailed-description.txt`](detailed-description.txt). Paste it as is. |
| Category | Developer Tools |
| Language | English |
| Homepage URL | https://github.com/mimukit/pixaloy |
| Support URL | https://github.com/mimukit/pixaloy/issues |
| Privacy policy URL | https://mimukit.github.io/pixaloy/privacy/ |

## Name

The manifest `name` is "Pixaloy". The store item name is "Pixaloy: CSS Inspector and Style Copier". "Component Copier" is out, because subtree copy is a v1.x feature.

## Summary

The summary comes from the manifest `description` in `wxt.config.ts`. It must stay at 132 characters or fewer. `description.txt` holds the same text, with no trailing newline. If you change one, change the other.

## Graphic assets

`pnpm screenshots` makes the 1280x800 screenshots and the 440x280 small promo tile from the fixture pages. The 128x128 store icon is the same icon the manifest uses (96x96 artwork with 16 px transparent padding).

## What the description may claim

Only the MVP features: hover box-model overlay, pin with a click and move with the arrow keys, grouped computed styles, copy minimized standalone CSS, copy a unique selector, copy single values, page colours with counts in HEX, RGB, HSL and OKLCH, and font-family stacks with counts. Do not describe a v1.x or v2 feature until it ships.
