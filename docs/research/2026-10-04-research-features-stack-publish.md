# Pixaloy research: features, stack, and publish workflow

Date: 2026-10-04. Scope: a free, open-source Chrome extension that inspects CSS and styles on any live page and copies or clones components. The goals are a published Chrome Web Store (CWS) listing and full knowledge of the build and publish workflow. Decisions already made: React, Chrome first with Edge and Firefox later, a small MVP published fast.

Evidence comes from three research passes on 2026-10-04: the competitor market, the framework and platform ecosystem, and the CWS publish workflow. Store numbers come from the live CWS pages, repo numbers from the GitHub API, and package numbers from npm, all read on that date. "Unverified" marks a claim with no primary source.

## 1. Summary and recommendations

1. **Build it.** The gap is real. Google archived VisBug, the main open-source tool in this space (200k users), on 2026-09-15. The good copy tools are paid: CSS Scan ($79 to $120 once), DivMagic ($16/mo or $200 lifetime), Hoverify ($30/yr or $89 lifetime), and the "copy CSS" part of CSS Peeper is Pro. No free tool combines authored-CSS copy, Tailwind output, a token audit, and local-only processing.
2. **Position it as the open-source successor to VisBug for developers who copy code.** The most frequent review complaints are a surprise paywall, privacy (CSS Peeper reviews report donation pop-ups on checkout pages and IP collection), and abandonment. A local-only, auditable, MIT tool answers all three.
3. **Use WXT with React.** WXT 0.21.x is the most active framework (10.5k stars, 830k npm downloads a week, packages released on the research date). Plasmo has had no commit on main since 2025-05-17. Avoid it. CRXJS 3.0 recovered from its 2025 maintenance crisis and is the fallback if you want true Vite HMR in content scripts.
4. **Use `activeTab` + `scripting` + `storage`, and no `<all_urls>`.** These permissions show no install warning and avoid the slower review that broad host permissions trigger. Inject the inspector when the user clicks the toolbar icon.
5. **Use computed styles in the MVP, and authored CSS later.** Computed styles always work, across origins too. Authored CSS (the real rules with `rem`, `var()`, `:hover` and media queries) is the hard part, and it is the main difference from the free tools. Ship it in v2, behind optional permissions.
6. **Publish the MVP to the store first, then automate.** The first item must be created by hand in the dashboard. CI publishing comes second, and it must use **CWS API v2**, because v1.1 stops on **2026-10-15**.

## 2. Market scan

### 2.1 The five named extensions

| Extension | Price | Users / rating | Last update | Open source | What it is good at |
|---|---|---|---|---|---|
| [CSS Scan](https://getcssscan.com/) | Paid, $79 to $120 once (current price unverified) | 10k / 3.5 | 2026-04-16 | No | Hover inspect, one-click copy of minimal authored CSS, pseudo-states, media queries, Tailwind output, child elements, CodePen export, keyboard DOM navigation |
| [CSS Peeper](https://chromewebstore.google.com/detail/css-peeper/mbnbehikldjhnfehhnaidhjhoofhpehk) | Freemium. CSS copy, gradients, shadows and sidebar are Pro | 400k / 4.1 | 2026-09-11 | No | Designer view: colours, typography, assets. Recent reviews report injected pop-ups and IP collection |
| [Peek](https://chromewebstore.google.com/detail/peek-design-asset-toolkit/ioamghgbfkachnkafmlfjgddjljidcbi) | Free | 6k / 4.7 | 2026-09-29 | No repo found | Page design audit with scores, design tokens export (CSS, SCSS, Tailwind v3/v4, JSON), OKLCH, shadow layers, SVG recolour, local only |
| [Picker.Design](https://chromewebstore.google.com/detail/pickerdesign/igagodnhccefnjijnldcnnockcefbknn) | Free on CWS, $29 licence on the site (conflict) | 607 / 4.7 | 2026-08-31 | No | Element HTML with authored CSS and class names, full-page single-file clone, "design to AI prompt", colours by role, screenshots |
| [UI Extractor](https://chromewebstore.google.com/detail/ui-extractor-%E2%80%93-by-pixelli/emocjjojpnjfgjeekbgmfpmjbgkpgjoo) | Free | 491 / 4.7 | 2026-05-20 | No | Self-contained HTML+CSS snippet with CSS variables, media queries, fonts and keyframes. It rebuilds the parent structure so selectors still match |

### 2.2 Other relevant extensions

| Extension | Price | Users | Open source | Note |
|---|---|---|---|---|
| VisBug | Free | 200k | Apache-2.0, **archived 2026-09-15** | Visual editing, measure, move. No code copy |
| SnipCSS / SnipCSS Kiwi Free | Free now | 20k / 390 | No | Authored CSS through CDP, Tailwind output, class scoping. The developer lost the publisher account in April 2026 and relaunched |
| DivMagic | $16/mo, $200 lifetime | 10k / 3.3 | No | Copy as CSS, Tailwind or React/JSX. Reviews: "couldn't try for free" |
| Hoverify | $30/yr, $89 lifetime | 40k / 4.1 | No | The most complete paid suite: authored rules, shadow roots, live edit, assets, audits |
| CSSViewer | Free | ~200k | Yes, dormant since 2021 | Read-only hover popup |
| WhatFont | Free | 3M | Bookmarklet only | Font identification on hover |
| ColorZilla | Free | 4M | No | Eyedropper, page palette, gradient generator |
| Fonts Ninja | Free | 900k | No | Font identification from the font file |
| Dimensions | Free | 100k | MIT, active 2025 | Distance measurement |
| Pesticide forks | Free | ~119k+ | Mixed, fragmented | Outline every element |
| Stylebot | Free | 200k | MIT, active | Per-site user styles |
| html.to.design, Figma ext | Freemium | ~700k | No | Page to editable Figma layers |
| Anima, Pluck, step1.dev, UICloner | Freemium or BYOK | small | UICloner MIT, dormant | AI-based clone to React/Tailwind, or a prompt for an AI coding tool |

### 2.3 Gaps a free open-source tool can fill

- No paywall and no licence check on first run.
- Local only, with no network calls, provable from the source.
- Maintained on MV3. Four of the open tools are archived, dormant, or fragmented.
- Copy quality on authored CSS, which only CSS Scan, SnipCSS and Hoverify do well, and all three are paid or unstable.
- Undo and reset in edit mode (asked for in VisBug reviews).
- Overlay that works in iframes and above fixed headers (CSSViewer complaints).

## 3. Feature catalogue

Every feature found in the market, plus a few gaps, grouped by category. The phase column is the recommendation. **MVP** is the first published version. **v1.x** follows in small releases. **v2** is the authored-CSS release. **Later** is optional.

### 3.1 Inspection

| Feature | Competitors | Phase |
|---|---|---|
| Hover overlay with tag, class, size, box-model highlight | Most | MVP |
| Click to pin an element, Esc to exit | CSS Scan | MVP |
| Panel with key computed values grouped (layout, box, typography, colour, effects) | CSS Peeper, CSSViewer | MVP |
| Keyboard DOM navigation (parent, child, sibling) | CSS Scan, VisBug | MVP |
| Box model view (margin, border, padding, content) | VisBug, CSSViewer | MVP |
| Full authored rule list with source file | CSS Scan, SnipCSS, Hoverify | v2 |
| Pseudo-elements (`::before`, `::after`) | CSS Scan, Hoverify | v1.x (computed), v2 (rules) |
| Forced states (`:hover`, `:focus`) | CSS Scan, SnipCSS | v2 |
| Media and container query rules | CSS Scan, Hoverify | v2 |
| Shadow DOM elements | Hoverify only | v2 |
| Iframe elements | DivMagic (claimed) | Later |
| Outline every element | Pesticide, VisBug | v1.x |
| Tech-stack detection (Tailwind, Bootstrap, React) | Peek, Hoverify | Later |

### 3.2 Copy and export

| Feature | Competitors | Phase |
|---|---|---|
| Copy one element's CSS (computed, minimized) | CSS Scan, Hoverify, DivMagic, CSS Peeper Pro | MVP |
| Copy a unique selector | Hoverify | MVP |
| Copy one property value on click | Several | MVP |
| Copy HTML+CSS of a subtree as a component | CSS Scan, SnipCSS, UI Extractor, Picker | v1.x (computed), v2 (authored) |
| Scope or rename classes to avoid conflicts | SnipCSS | v1.x |
| Keep authored units and `var()` | CSS Scan, SnipCSS | v2 |
| Tailwind v4 classes output | CSS Scan, SnipCSS, DivMagic Pro | v2 |
| React/JSX output | DivMagic Pro, Anima | v2 |
| Vue and Svelte output | Pluck (prompt) | Later |
| CodePen export | CSS Scan, UI Extractor, Hoverify | v1.x |
| ZIP with HTML, CSS, images, fonts | SnipCSS | Later |
| Saved snippet library | DivMagic Pro, Hoverify | Later |

### 3.3 Clone a component or a page

| Feature | Competitors | Phase |
|---|---|---|
| Self-contained component with CSS variables, fonts, keyframes and parent context | UI Extractor, SnipCSS, Picker | v2 |
| Absolute URLs for images and fonts | UI Extractor | v1.x |
| Full page as one HTML file | Picker, CloneWebsite | Later |
| Multi-breakpoint capture | DivMagic, old SnipCSS Pro | Later |

### 3.4 Colours

| Feature | Competitors | Phase |
|---|---|---|
| Page palette with counts | ColorZilla, CSS Peeper, Peek | MVP |
| Formats: HEX, RGB, HSL, OKLCH | Peek, Hoverify | MVP |
| Colours grouped by role (text, background, border) | Picker, CSS Peeper Pro | v1.x |
| Pixel eyedropper (browser `EyeDropper` API) | ColorZilla, Hoverify | v1.x |
| Gradient extraction | Peek, CSS Peeper Pro | v1.x |
| WCAG contrast check | CSS Peeper, Peek, Hoverify | v1.x |
| Nearest Tailwind colour | Hoverify | v2 |

### 3.5 Typography

| Feature | Competitors | Phase |
|---|---|---|
| Font family, size, weight, line-height on hover | WhatFont, CSS Peeper, Peek | MVP |
| Page font list with usage counts | CSS Peeper, Peek | MVP |
| Type scale view | Peek, CSS Peeper Pro | v1.x |
| The font that actually renders (CDP `getPlatformFontsForNode`) | Fonts Ninja (by other means) | v2 Deep mode |

### 3.6 Assets

| Feature | Competitors | Phase |
|---|---|---|
| List images and SVGs, with download | CSS Peeper, Peek, Picker, Hoverify | v1.x |
| Background images, `srcset`, inline SVG | Picker, Pluck | v1.x |
| Copy inline SVG as code | Several | v1.x |
| SVG recolour | Peek | Later |
| Element screenshot | Picker, Hoverify | v1.x |

### 3.7 Layout and measurement

| Feature | Competitors | Phase |
|---|---|---|
| Distance between two elements | VisBug, Dimensions | v1.x |
| Flex and grid overlay | Hoverify | Later |
| Shadows split into layers, radius list | Peek | v1.x |

### 3.8 Page audit and design tokens

| Feature | Competitors | Phase |
|---|---|---|
| Design tokens export (CSS variables, Tailwind v4 `@theme`, JSON) | Peek only | v2 |
| Design consistency score | Peek | Later |
| Accessibility audit (axe-core, bundled) | Hoverify | Later |

### 3.9 Editing

| Feature | Competitors | Phase |
|---|---|---|
| Live CSS edit on the pinned element | CSS Scan, Hoverify, VisBug | Later |
| Edit text, hide or delete elements before copy | VisBug, Picker | Later |
| Undo and reset | No one (a gap) | Later, with editing |

### 3.10 AI and integrations

| Feature | Competitors | Phase |
|---|---|---|
| "Copy as prompt" for an AI coding tool (structured, no API call) | Pluck, Picker | v2 |
| BYOK vision model regeneration | UICloner, Picker | Later, if ever |
| Figma layers export | html.to.design, Figma ext | Later, if ever |
| DevTools Elements sidebar pane ("copy as Tailwind/JSX" for `$0`) | No one in this list | v2 |

### 3.11 Proposed MVP

The MVP is a hover inspector that you can publish in a few weeks:

1. Click the toolbar icon to inject the inspector into the current tab.
2. Hover to highlight an element with its box model, tag and size.
3. Click to pin. A panel shows grouped computed values. Arrow keys move through the DOM. Esc exits.
4. Copy the element's minimized CSS, its selector, or one value.
5. A page tab lists colours (HEX, RGB, HSL, OKLCH) and fonts with counts.
6. Nothing leaves the device. No analytics in the MVP.

## 4. Framework and stack

### 4.1 Framework comparison

| Framework | Stars | Latest release | Health | Verdict |
|---|---|---|---|---|
| **WXT** | 10,565 | wxt 0.21.4 (2026-08-11), sub-packages 2026-10-04 | 100+ commits since July, 830k/wk | **Pick.** File-based entrypoints, cross-browser builds, `createShadowRootUi`, `wxt zip`, `wxt submit`, first-party Vitest fake-browser. Still 0.x |
| CRXJS (`@crxjs/vite-plugin`) | 4,178 | 3.0.0 (2026-09-24) | New maintainers since mid 2025, active | Fallback. True Vite HMR in content scripts. No storage, messaging, zip or publish helpers. Partial Firefox |
| Plasmo | 13,162 | 0.90.5 (2025-05-17) | No commits on main since then, unpatched dependencies reported | Avoid |
| Extension.js | 5,177 | 4.1.30 (2026-09-30) | Active, 7k/wk | Small user base |
| Bedframe | 582 | 0.1.2 | Low | Too small |
| Plain Vite 8 + web-ext | n/a | n/a | n/a | Full control, more hand work. Good for learning, slower to publish |

WXT caveat: HMR works only for iframe UIs. A change to a shadow-root UI reloads the content script. The reload is fast, and the batteries outweigh it.

### 4.2 Recommended stack

| Layer | Choice |
|---|---|
| Framework | WXT 0.21.x + `@wxt-dev/module-react` |
| Language | TypeScript |
| UI | React 19, Tailwind v4 inside `createShadowRootUi` |
| Components | Radix or shadcn only with portals pointed into the shadow root |
| UI state | zustand 5 |
| Persisted settings | `@wxt-dev/storage` |
| Messaging | `@webext-core/messaging` 4 (typed). `webext-bridge` is stale |
| Colour maths | `culori` or `colord` |
| CSS parsing (v2) | `postcss` or `css-tree` |
| Screenshot | `chrome.tabs.captureVisibleTab` + crop in `OffscreenCanvas`. `@zumer/snapdom` as the DOM-render option |
| Unit tests | Vitest + `WxtVitest()` |
| E2E tests | Playwright `launchPersistentContext` with bundled Chromium |
| Lint | ESLint flat config or Biome. `web-ext lint` for the Firefox build |
| CI | GitHub Actions: typecheck, test, build Chrome and Firefox, zip, submit on tag |
| Licence | MIT |

### 4.3 Known traps in the stack

- **Tailwind v4 in a shadow root.** Issue tailwindlabs/tailwindcss#15005 is still open. `@property` rules do not work inside a shadow root, so borders, shadows, rings and translate break. Workaround: replace `:root` with `:host` and move the `@property` rules into `document.adoptedStyleSheets`.
- **`rem` in a shadow root.** `rem` follows the page `<html>` font-size, so the UI size changes per site. Use a px-based theme or set sizes on `:host`.
- **`@font-face` in a shadow root is ignored.** Register UI fonts on the document, or use system fonts.
- **Radix portals** go to `document.body` by default, outside the shadow root and its styles. Pass `container` on every portal.
- **No CSS-to-Tailwind v4 library is healthy.** `css-to-tailwindcss` bundles Tailwind 3. Plan to write a v4 mapper, with arbitrary values (`w-[13px]`) as the fallback.

## 5. Extension architecture (MV3)

### 5.1 Parts

| Part | Job |
|---|---|
| Service worker (background) | Listens for the toolbar click, injects the content script, handles screenshots and clipboard fallback. Keeps no state in globals, because Chrome stops it after 30 s idle |
| Content script | The inspector: overlay, hover, pin, reading styles. Its UI lives in a shadow root |
| Popup or side panel | Page-level views: colours, fonts, assets, settings |
| Offscreen document | Clipboard fallback and DOM parsing if needed |
| DevTools page (v2) | An Elements sidebar pane that works on `$0` |

### 5.2 Permissions plan

| Permission | Install warning | Phase | Why |
|---|---|---|---|
| `activeTab` | None | MVP | Access to the current tab after the icon click |
| `scripting` | None | MVP | Inject the inspector on demand |
| `storage` | None | MVP | Settings |
| `sidePanel` | None | v1.x | Page views in a side panel |
| `offscreen` | None | v1.x | Clipboard fallback |
| Optional host permissions | Shown at request time | v2 | Fetch cross-origin stylesheets for authored CSS |
| Optional `debugger` | Strong warning, plus a "debugging this browser" bar | v2 Deep mode | CDP `CSS.getMatchedStylesForNode` |

Do not request `<all_urls>`, `tabs`, or `clipboardWrite` unless a feature needs them. Each one adds a warning, a justification, and review time.

Open item: test whether `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` still grants `activeTab`. If it does not, the toolbar click must stay the entry point, and the side panel opens from inside the inspector.

### 5.3 Clipboard

Copy from a click inside the extension's own UI, with `navigator.clipboard.writeText`. If the page blocks it, send a message to the service worker, which writes through an offscreen document with reason `CLIPBOARD`.

## 6. Technical hard parts

| Problem | Approach |
|---|---|
| Computed CSS is about 400 resolved properties | Diff against a baseline element of the same tag in a clean context. Drop defaults and inherited-equal values. Collapse longhands into shorthands |
| Authored CSS | Walk `document.styleSheets`, `adoptedStyleSheets` and shadow roots. Test each rule with `el.matches()`. Recurse into `@media`, `@layer`, `@supports`, `@container`. Sort by cascade order and specificity |
| Cross-origin stylesheets throw on `cssRules` | Fetch the sheet URL from the service worker with an optional host permission, then parse with postcss or css-tree |
| Exact DevTools cascade | Optional Deep mode with CDP `CSS.getMatchedStylesForNode`. It costs the `debugger` warning and the browser banner |
| Pseudo-elements and states | `getComputedStyle(el, '::before')` for content. `:hover` rules come from the CSSOM walk or CDP `CSS.forcePseudoState` |
| CSS variables | Collect the custom properties that the subtree uses from ancestors and `:root` |
| Selector context breaks after extraction (`.parent .child`) | Rename and scope classes, or rebuild the needed parent chain |
| Fonts and keyframes | Find the `@font-face` and `@keyframes` rules in use. Rewrite URLs to absolute |
| Assets | Handle `srcset`, `image-set()`, CSS background URLs, `<use href>` sprites, data URIs, lazy images |
| JS state and canvas | Not reproducible from a snapshot. State the limit in the docs |
| Scale | Per-node CDP calls are slow. Limit the subtree size and show progress |

The approach for v2 is a layered engine: computed styles always, the CSSOM walk when sheets are readable, a fetch for cross-origin sheets when the user grants the host, and CDP only in Deep mode.

## 7. Publish workflow

### 7.1 Facts that drive the plan

- Registration costs US$5 once. 2-Step Verification is required. The account email cannot change later. You get one publisher per account.
- You must declare trader or non-trader status (EU DSA). A hobby project with no revenue usually declares non-trader.
- **A privacy policy is required**, even when all data stays local. The CWS User Data FAQ counts reading page content as handling user data. A short policy that says "processed locally, nothing sent or stored remotely" is enough.
- Required assets: 128x128 icon (96x96 artwork with 16 px padding), at least one 1280x800 screenshot (up to 5), and a 440x280 small promo tile. The 1400x560 marquee is optional.
- The manifest `description` is the store summary, 132 characters at most.
- The Privacy tab needs a single-purpose statement, one justification per permission, a "no remote code" answer, data-use checkboxes ("Website content"), and three certifications.
- Review takes a few days, up to a few weeks. New developers, new items, broad host permissions and large code all add time.
- Minified code is allowed. Obfuscated code is rejected (Red Titanium). Unused permissions are rejected (Purple Potassium). A missing privacy policy is rejected (Purple Lithium).
- Visibility can be Public, Unlisted, or Private (trusted testers). Deferred publish gives 30 days after approval. Percentage rollout needs more than 10,000 weekly users.
- Appeals go through the dashboard since 2026-04-08.
- **CWS API v1.1 stops on 2026-10-15.** Use v2 (`chromewebstore.googleapis.com`) with `chrome-webstore-upload-cli@4` or `wxt submit` with `CHROME_API_VERSION=v2`. The API cannot create the first item, so the first upload is by hand.
- For CI OAuth, set the consent screen to "In production". In "Testing" mode refresh tokens expire after 7 days. A service account is the alternative in v2.

### 7.2 Checklist

1. Build MV3 only, with `activeTab` + `scripting` + `storage`. No remote code. Keep minification readable.
2. Write the privacy policy and host it at a stable URL (GitHub Pages or the repo).
3. Make the icon, at least 3 screenshots at 1280x800, and the 440x280 tile.
4. Write the 132-character description, the detailed description, the single-purpose statement, and one justification per permission.
5. Create a dedicated Google account. Turn on 2-Step Verification, with a hardware key if possible.
6. Register in the CWS developer dashboard and pay US$5.
7. Declare non-trader status and verify the contact email.
8. Create the item by hand. Upload the zip. Fill in the Store listing, Privacy and Distribution tabs.
9. Set visibility to Private, add yourself as a trusted tester, and install from the store.
10. Change visibility to Public, untick auto-publish, and submit.
11. Wait for review. Fix and resubmit, or appeal from the dashboard, if rejected.
12. Publish within 30 days of approval.
13. Set up CI on API v2. Store the credentials as GitHub secrets in a protected `release` environment.
14. Release from a git tag. Keep the manifest version equal to the tag. Attach the store zip and its SHA-256 to the GitHub Release.
15. Watch the dashboard metrics. Nominate for the Featured badge after launch.
16. Later, Edge: Partner Center is free, the Chrome zip ports without change, and certification takes up to 7 business days.
17. Later, Firefox: add `gecko.id` and `data_collection_permissions: { required: ["none"] }`. Upload the source and a build README, because AMO rebuilds bundled code byte for byte.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Copy quality on real sites is worse than paid tools | Ship computed-style copy first, measure on 10 real sites, and build the authored engine in v2 |
| Tailwind v4 shadow-root bug breaks the UI | Apply the `@property` workaround and test on several sites early |
| Store review rejects the item | Narrow permissions, a single-purpose statement, a privacy policy, readable code |
| Account takeover or buy-out offers | Dedicated account with 2SV, CI-only credentials, and a README statement that the extension is not for sale. QuickLens was sold and turned malicious in February 2026 |
| Store account loss (it happened to SnipCSS) | Attach every release zip to GitHub Releases as a second distribution path |
| WXT is still 0.x | Pin the version. CRXJS is the fallback |
| Scope grows before the first publish | Hold the MVP to section 3.11 |

## 9. Open questions

1. Is the store name "Pixaloy", or a descriptive name such as "Pixaloy: CSS Inspector and Component Copier"? Check for collisions on CWS first.
2. Does the side panel grant `activeTab`? This decides the main entry point.
3. Which output targets come first in v2: Tailwind v4, React/JSX, or plain scoped CSS?
4. Is a DevTools sidebar pane worth a v2 slot? No competitor in the scan has one.
5. Is anonymous usage analytics ever acceptable? The privacy position says no. Any change needs a new disclosure.

## 10. Sources

Market:
- https://getcssscan.com/
- https://chromewebstore.google.com/detail/css-scan/gieabiemggnpnminflinemaickipbebg
- https://chromewebstore.google.com/detail/css-peeper/mbnbehikldjhnfehhnaidhjhoofhpehk
- https://chromewebstore.google.com/detail/peek-design-asset-toolkit/ioamghgbfkachnkafmlfjgddjljidcbi
- https://chromewebstore.google.com/detail/pickerdesign/igagodnhccefnjijnldcnnockcefbknn
- https://picker.design/
- https://chromewebstore.google.com/detail/ui-extractor-%E2%80%93-by-pixelli/emocjjojpnjfgjeekbgmfpmjbgkpgjoo
- https://github.com/GoogleChromeLabs/ProjectVisBug
- https://chromewebstore.google.com/detail/snipcss-kiwi-free/lhljehcbbofodgfkibklodekancpgolp
- https://divmagic.com/extension-pricing
- https://tryhoverify.com/
- https://github.com/miled/cssviewer
- https://github.com/mrflix/dimensions
- https://github.com/ankit/stylebot
- https://html.to.design/home/
- https://www.pluck.so/
- https://github.com/AndySpider/uicloner-extension

Stack and platform:
- https://github.com/wxt-dev/wxt
- https://wxt.dev/guide/essentials/content-scripts
- https://wxt.dev/guide/essentials/unit-testing
- https://wxt.dev/guide/resources/compare
- https://github.com/PlasmoHQ/plasmo
- https://github.com/crxjs/chrome-extension-tools/discussions/974
- https://extension.js.org/blog/announcing-3-0-0
- https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- https://developer.chrome.com/docs/extensions/reference/permissions-list
- https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools
- https://developer.chrome.com/docs/extensions/reference/api/offscreen
- https://developer.chrome.com/docs/extensions/reference/api/debugger
- https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code
- https://github.com/tailwindlabs/tailwindcss/issues/15005
- https://github.com/Jackardios/css-to-tailwindcss
- https://github.com/zumerlab/snapdom
- https://playwright.dev/docs/chrome-extensions

Publishing:
- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/webstore/program-policies/user-data-faq
- https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure
- https://developer.chrome.com/docs/webstore/images
- https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
- https://developer.chrome.com/docs/webstore/review-process
- https://developer.chrome.com/docs/webstore/troubleshooting
- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/blog/cws-api-v2
- https://developer.chrome.com/docs/webstore/using-api
- https://developer.chrome.com/docs/webstore/service-accounts
- https://developer.chrome.com/blog/cws-new-appeals-process
- https://developer.chrome.com/blog/cws-policy-updates-2026
- https://github.com/fregante/chrome-webstore-upload-cli
- https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- https://extensionworkshop.com/documentation/publish/source-code-submission/
- https://blog.mozilla.org/addons/2025/10/23/data-collection-consent-changes-for-new-firefox-extensions/
- https://thehackernews.com/2026/03/chrome-extension-turns-malicious-after.html
