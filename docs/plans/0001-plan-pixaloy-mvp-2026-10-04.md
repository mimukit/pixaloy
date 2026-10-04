# Plan: Pixaloy MVP, from an empty repo to a public Chrome Web Store listing

Grilled: 2026-10-04

## Context

Pixaloy is a free, open-source (MIT) Chrome extension. It inspects CSS on a live page and copies an element's styles. It also lists the page colours and fonts. All processing stays on the device.

The problem: Google archived VisBug on 2026-09-15, and the tools that copy CSS well are paid (CSS Scan, DivMagic, Hoverify, CSS Peeper Pro). Users complain about surprise paywalls, privacy, and abandoned tools. A local-only MIT tool answers all three. Source: [the research report](../research/2026-10-04-research-features-stack-publish.md).

The user is a front-end developer who wants to copy a style or a value from a live site, with no account and no paywall.

The work happens in this repo, which becomes `mimukit/pixaloy`. The research report and this plan stay in `docs/` in the same repo. This plan is the PRD for that repo.

Success means three things:

1. The MVP is public on the Chrome Web Store.
2. A git tag publishes the next version through CI on CWS API v2.
3. The owner has done each step of the build and publish workflow once, by hand or in CI, and wrote it down.

## Design decisions (settled)

| Decision | Resolution |
|----------|-----------|
| Repo | This directory becomes `mimukit/pixaloy`, public, MIT licence. The default branch is `main`. The research report and the plans live in `docs/` in the same repo. |
| Plan scope | MVP to the first public publish plus CI publishing. v1.x and v2 stay in the roadmap list under Non-goals. |
| Framework | WXT 0.21.x with `@wxt-dev/module-react`, version pinned. CRXJS 3.0 is the fallback. Plasmo is out (no commit on main since 2025-05-17). |
| Language and UI | TypeScript, React 19, Tailwind v4 inside `createShadowRootUi`. zustand 5 for UI state. `@wxt-dev/storage` for settings. `@webext-core/messaging` 4 for typed messages. |
| Panel styling | Tailwind v4 with the shadow-root workaround: `:root` becomes `:host`, and the `@property` rules go into `document.adoptedStyleSheets`. Use a px-based theme and system fonts. The `@property` rules stay on the page after exit (see Known risks). |
| Permissions | `activeTab`, `scripting`, `storage`. No `<all_urls>`, `tabs`, `clipboardWrite`, `sidePanel` or `offscreen` in the MVP. These three show no install warning. |
| Entry point | A toolbar icon click injects the inspector into the current tab. The MVP has no popup and no side panel. The page view is a tab inside the injected panel. |
| Restricted pages | When `executeScript` fails (`chrome://` pages, the Web Store, the PDF viewer, `file://` without consent), the service worker sets a `!` badge and an action title with the reason on that tab, and clears both after 3 s. No new permission. |
| Overlay layering | The overlay and panel host use `popover="manual"` and `showPopover()`, so they sit in the top layer above fixed headers and page dialogs. When the page opens a new top-layer element, the inspector shows its host again to move it back on top. |
| Copy contract | Standalone. The copied CSS renders the same in a blank page. The minimizer drops a property only when its value equals the UA default for the same tag. It keeps inherited values such as `font-family` and `color`. |
| Style baseline | The UA default comes from a hidden iframe inside the panel's shadow root. The iframe has no `src`, and the engine writes `<!doctype html>` into it to get standards mode. It creates one element per tag and caches the computed result per tag. |
| Shorthands | The minimizer collapses only `margin`, `padding`, `inset`, `gap`, `border-radius`, `overflow`, and `border` when all four sides match. All other properties stay longhand. |
| Style source | Computed styles only. Authored CSS waits for v2. |
| Unique selector | `@medv/finder` 4.0.2, with a class filter that rejects hashed CSS-in-JS classes (for example `css-1x2y3z`, `sc-abc12`). |
| Clipboard | `navigator.clipboard.writeText` from a click inside the extension UI. If a page blocks it, the panel shows the text in a selectable box. The offscreen fallback waits for v1.x. |
| Colour library | `culori` 4.x. It supports OKLCH natively. `colord` 2.10 has no OKLCH plugin. |
| Colour counting | One count per visible element per property, for `color`, `background-color`, the border colours where the border width is above 0, `outline-color`, `fill` and `stroke`. Skip `transparent`, hidden elements, and Pixaloy's own host. Different alpha values count as different colours. The scan runs in `requestIdleCallback` chunks. |
| Font list | The full `font-family` stack, counted once per element that has a direct text node. The panel says that the rendered font comes in a later version. |
| Privacy | No network call, no analytics. A short privacy policy says so. It is hosted on GitHub Pages at `mimukit.github.io/pixaloy/privacy/`, with no custom domain. |
| Store name | "Pixaloy: CSS Inspector and Style Copier". "Component Copier" is out, because subtree copy is a v1.x feature. |
| Lint and format | ESLint flat config with `eslint-plugin-react-hooks`, plus Prettier. |
| Browsers | Chrome only at launch. Code stays on WXT browser APIs so the Edge and Firefox builds are a later step, not a rewrite. |
| Publish order | The first upload is by hand in the CWS dashboard. CI publishing comes after the first approval and uses API v2 only, because v1.1 stops on 2026-10-15. |
| CI credentials | `wxt submit` with `CHROME_API_VERSION=v2` and a service-account key. In v2 mode `wxt submit` (`publish-browser-extension` 6.x) accepts only service-account credentials. No OAuth consent screen, no refresh token. GitHub OIDC with workload identity federation is a later hardening step. |
| Tests | Vitest with `WxtVitest()` for the style engine. Playwright `launchPersistentContext` for one end-to-end path. |

## Test sites

Phase 2 uses five sites:

1. `tailwindcss.com` (Tailwind, dark theme)
2. `github.com` (fixed header, strict CSP)
3. `developer.mozilla.org` (plain CSS)
4. `stripe.com`
5. `news.ycombinator.com` (quirks mode)

Phase 3 uses those five plus:

6. `wikipedia.org`
7. `airbnb.com` (CSS-in-JS)
8. `linear.app`
9. `bbc.com`
10. `vercel.com`

## Approach

The recommended approach is a WXT project with a content script that mounts a React panel in a shadow root. The style engine (read, minimize, format) is a plain TypeScript module with no DOM framework in it. Unit tests can then run it in the WXT fake browser, and v2 can add the authored-CSS layers behind the same interface.

Two alternatives were rejected:

- Plain Vite 8 plus `web-ext`. It teaches more of the raw platform, but it costs zip, submit, and cross-browser work that WXT gives for free. The goal is a fast first publish.
- A DevTools sidebar pane as the main surface. No competitor has one, but it hides the tool from users who do not open DevTools. It stays a v2 candidate.

The account and store setup in Phase 5 has no code dependency. Start the Google account and the US$5 registration during Phase 2, so that the account is ready when the build is.

### Phase 1: Repo bootstrap (#1) (built 2026-10-04)

- Rename the branch to `main` and create the public `mimukit/pixaloy` repo from this directory (`gh repo create mimukit/pixaloy --public --source .`).
- Add an MIT licence and a README. The README says the extension is local-only and not for sale.
- Scaffold WXT with the React module and TypeScript. Pin the WXT version. Use pnpm.
- Add ESLint flat config with `eslint-plugin-react-hooks`, Prettier, Vitest with `WxtVitest()`, and a `typecheck` script.
- Add a GitHub Actions workflow on push and PR: install, typecheck, lint, format check, test, `wxt build`, `wxt zip`.
- Set the manifest to MV3 with `activeTab`, `scripting`, `storage` only.

Done when: CI is green on `main`, `pnpm wxt zip` writes a Chrome zip, and the unpacked build loads in Chrome with no install warning.

### Phase 2: Inspector core (#1) (built 2026-10-04)

- On the toolbar click, the service worker injects the content script with `chrome.scripting.executeScript`. A second click or Esc removes it.
- On a restricted page, the injection fails, and the service worker shows the `!` badge and the reason in the action title for 3 s.
- Mount the UI with `createShadowRootUi`. Apply the Tailwind v4 workaround: `:root` to `:host`, and the `@property` rules in `document.adoptedStyleSheets`. Use a px-based theme and system fonts.
- Put the overlay and panel host in the top layer with `popover="manual"` and `showPopover()`.
- Draw a hover overlay with the box model (margin, border, padding, content), the tag, the classes, and the size.
- Click pins an element. Arrow keys move to the parent, the first child, and the siblings. Esc unpins, then exits.
- The overlay never captures the page's own clicks after exit, and it sits above fixed headers and open page dialogs.

Done when: on the five Phase 2 test sites, a tester can hover, pin, move with the arrow keys, and exit, and the panel looks the same on each site. A Playwright test covers icon click, hover, pin, and Esc on a local fixture page. A second fixture page with an open `<dialog>` shows the overlay above the dialog.

### Phase 3: Element panel and copy (#1) (built 2026-10-04)

- The pinned panel shows the computed values in groups: layout, box, typography, colour, effects.
- The style engine reads `getComputedStyle` and diffs it against the same-tag baseline from the hidden standards-mode iframe. It drops a property only when it equals that baseline. It collapses the fixed shorthand list.
- Copy actions: the element's minimized CSS, a unique selector from `@medv/finder` with the hashed-class filter, and one value on click.
- A toast confirms each copy. A blocked clipboard shows the text in a selectable box.

Done when: unit tests cover the minimizer on at least 10 fixture elements, with one fixture per collapsed shorthand, and each passes. A fixture page with `* { box-sizing: border-box }` and a strict CSP gives a copy that keeps `box-sizing`. On the 10 Phase 3 test sites, the copied CSS for a chosen element renders the same in a blank page, judged by eye and recorded in `docs/qa/` with one line per site.

### Phase 4: Page view (#1) (built 2026-10-04)

- A second panel tab lists the page colours with usage counts, in HEX, RGB, HSL and OKLCH, through `culori`. Counting follows the colour counting rule in the design decisions.
- The same tab lists the `font-family` stacks with usage counts, plus the size, weight and line-height of the pinned element. A note says that the rendered font comes in a later version.
- Click on a colour or a font copies it.

Done when: on a fixture page with known colours and fonts, including a hidden element and a `transparent` value that must not count, a unit test matches the counts exactly. On three of the test sites, the list matches what DevTools shows for five sampled elements.

### Phase 5: Store readiness and private release (#1)

- Search CWS for "Pixaloy" and confirm that no item uses the name.
- Write the privacy policy ("processed locally, nothing sent or stored remotely") and publish it on GitHub Pages at `mimukit.github.io/pixaloy/privacy/`.
- Make the 128x128 icon (96x96 artwork, 16 px padding), three or more 1280x800 screenshots, and the 440x280 promo tile.
- Write the 132-character manifest description, the detailed description, the single-purpose statement, and one justification for each permission. Keep them in `store/` in the repo. The store name is "Pixaloy: CSS Inspector and Style Copier".
- Create a dedicated Google account with 2-Step Verification. Register in the CWS dashboard and pay US$5. Declare non-trader status and verify the contact email.
- Create the item by hand, upload the zip, and fill in the Store listing, Privacy and Distribution tabs. Set visibility to Private with the owner as a trusted tester.

Done when: the owner installs Pixaloy from the CWS listing as a trusted tester, and the store build passes the Phase 2 to 4 checks.

### Phase 6: Public launch

- Change visibility to Public, turn off auto-publish, and submit for review.
- If the review rejects the item, record the violation code, fix it, and resubmit or appeal from the dashboard.
- Publish within 30 days of approval.
- Attach the store zip and its SHA-256 to a GitHub Release `v0.1.0`.

Done when: the public CWS URL installs Pixaloy in a clean Chrome profile, and GitHub Release `v0.1.0` carries the same zip with its checksum.

### Phase 7: CI publishing on API v2 (#1)

- Enable the Chrome Web Store API in a Google Cloud project and create a service account.
- Add the service account email in the CWS Developer Dashboard, in the Account section. CWS allows one service account per publisher.
- Store `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID`, `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` and `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` as secrets in a protected GitHub `release` environment.
- Add a release workflow on a `v*` tag: check that the manifest version equals the tag, build, zip, submit with `wxt submit` and `CHROME_API_VERSION=v2`, and attach the zip and SHA-256 to the GitHub Release. Without `CHROME_API_VERSION=v2`, `wxt submit` calls v1.1, which stops on 2026-10-15.
- Write `docs/release.md` with the full manual and CI workflow, as the record of what the owner learned.

Done when: tag `v0.1.1` produces a GitHub Release with the zip and checksum, and the CWS dashboard shows version 0.1.1 in review or published, with no manual upload.

## Known risks

- The Tailwind v4 workaround registers global `@property` rules on the inspected page. They stay after exit and cannot be removed. A page that runs its own Tailwind v4 registers the same names, and the first registration wins. The MVP does not copy custom properties, so the copy output is not affected.
- The palette scan and the style engine must skip Pixaloy's own host element and the baseline iframe.

## Open questions

1. Deferred to v1.x: does `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` grant `activeTab`? It does not block the MVP. It decides the v1.x entry point.

## Non-goals

The MVP does not include these. They form the roadmap after launch, in the order from the research report.

- v1.x: side panel, offscreen clipboard fallback, pseudo-element computed values, outline-every-element mode, subtree copy with computed CSS, class scoping, CodePen export, colours by role, eyedropper, gradients, WCAG contrast, type scale, asset list and download, element screenshot, distance measurement, shadow layers.
- v2: authored CSS (CSSOM walk, cross-origin fetch with optional host permissions, CDP Deep mode), rendered font detection, forced states, media and container rules, shadow DOM elements, Tailwind v4 output, React/JSX output, design token export, "copy as prompt", a DevTools sidebar pane.
- Edge and Firefox builds.
- Live editing, undo, and reset.
- Any analytics, account, server, or paid tier.
- Elements inside iframes.
