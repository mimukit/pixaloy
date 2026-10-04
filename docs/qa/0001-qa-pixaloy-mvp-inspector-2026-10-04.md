# QA Plan: Pixaloy MVP inspector

_Generated 2026-10-04 · against `93479d8` (uncommitted changes: the whole MVP) · covers plan Phases 1 to 4 on real sites in desktop Chrome_

## Summary
- Pixaloy is a Chrome extension: a toolbar click injects an inspector that outlines elements, copies minimized CSS, and lists page colours and fonts.
- Working means that the inspector behaves the same on real sites as on the test fixtures, and that the copied CSS renders the same in a blank page.

## Environment
True for the whole plan. Do this once, before Scenario 1.

- Browser: desktop Chrome, stable channel, on your own machine. Do not use the headless dev box.
- Branch: `issue-1-build-the-pixaloy-mvp-inspector`. The build under test is the folder `.output/chrome-mv3`.
- No account, no credential, and no feature flag is necessary.
- In this plan, "the panel" is the Pixaloy box at the bottom right of the page. "The overlay" is the coloured box model on the page element. "The icon" is the Pixaloy icon in the Chrome toolbar.

1. Get the branch.

```sh
git fetch origin && git checkout issue-1-build-the-pixaloy-mvp-inspector && git pull
```

2. Install the dependencies and build the extension.

```sh
pnpm install && pnpm build
```

3. Make the blank test page. Scenario 1 and Scenario 3 use it.

```sh
cat > /tmp/pixaloy-blank.html <<'EOF'
<!doctype html>
<meta charset="utf-8">
<title>Pixaloy blank page</title>
<p><label>Tag <input id="tag" value="div"></label> <label>Text <input id="text" value="Sample text"></label> <button id="go">Render</button></p>
<textarea id="css" rows="10" cols="70" placeholder="Paste the copied CSS here"></textarea>
<hr>
<div id="stage"></div>
<script>
document.getElementById('go').onclick = () => {
  const el = document.createElement(document.getElementById('tag').value.trim() || 'div');
  el.textContent = document.getElementById('text').value;
  el.style.cssText = document.getElementById('css').value;
  document.getElementById('stage').replaceChildren(el);
};
</script>
EOF
```

4. Make sure that you have a Chrome profile with no other CSS extension turned on. Another inspector can change the result.

- [ ] Environment ready

## Test cases at a glance

Priority legend: 🔴 Critical · 🟡 Normal · 🟢 Low

| # | Scenario | Test case | Priority |
|------|----------|-----------|----------|
| TC-1.1 | 1: Extension freshly loaded, no tab inspected | Load shows no permission warning, and the icon looks right | 🔴 Critical |
| TC-1.2 | 1: Extension freshly loaded, no tab inspected | Restricted pages show the `!` badge and the reason for 3 s | 🟡 Normal |
| TC-2.1 | 2: Inspector active on a real site | Hover, pin, arrow keys and Esc work on the 5 Phase 2 sites | 🔴 Critical |
| TC-2.2 | 2: Inspector active on a real site | Keyboard focus reaches the panel controls | 🟡 Normal |
| TC-2.3 | 2: Inspector active on a real site | A page modal dialog makes the panel inert (known limitation) | 🟢 Low |
| TC-2.4 | 2: Inspector active on a real site | Exit leaves the page clean, and a new injection works | 🔴 Critical |
| TC-3.1 | 3: Element pinned on a real site | Copied CSS renders the same in the blank page on 10 sites | 🔴 Critical |
| TC-3.2 | 3: Element pinned on a real site | Copied selector is unique and has no hashed class; one value copies | 🟡 Normal |
| TC-4.1 | 4: Page tab open on a real site | Colours and fonts agree with DevTools on 3 sites | 🟡 Normal |
| TC-4.2 | 4: Page tab open on a real site | The scan keeps a heavy page responsive | 🟡 Normal |

## Scenario 1: Extension freshly loaded, no tab inspected

**Setup.** Run once, for every case in this scenario.

1. Open `chrome://extensions` in a new tab.
2. Turn on "Developer mode" at the top right.
3. If an older Pixaloy is in the list, click "Remove" on it.

- [ ] Setup complete

### TC-1.1: Load shows no permission warning, and the icon looks right  ·  🔴 Critical

**Goal.** Chrome loads the build with no permission warning, and the icon is clear in the toolbar.

**Steps**

1. Click "Load unpacked". Select the folder `.output/chrome-mv3` in the repo.
   - [ ] Chrome shows the Pixaloy card with no error and no warning dialog
     - the card shows the name "Pixaloy", version 0.1.0, and the icon
     - the card has no red "Errors" button
2. Click "Details" on the Pixaloy card.
   - [ ] The "Permissions" section says that the extension needs no special permissions
     - no "Read and change all your data on all websites" line
     - no "Site access" choice for all sites
3. Click the puzzle-piece Extensions button in the toolbar. Click the pin next to Pixaloy.
   - [ ] The icon is sharp and easy to recognize in the toolbar
     - no blur, no cut edge, no white box around the art
     - check it in the light Chrome theme and in the dark Chrome theme, if you use one
4. Hold the mouse pointer on the icon for 2 s.
   - [ ] The tooltip says "Pixaloy: inspect this page"

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _what actually happened on a fail; why it was skipped_

### TC-1.2: Restricted pages show the `!` badge and the reason for 3 s  ·  🟡 Normal

**Goal.** On each page that Chrome blocks, the icon shows a `!` badge and the reason, and both clear after about 3 s.

**Steps**

1. In the `chrome://extensions` tab, click the icon. Hold the pointer on the icon at once.
   - [ ] A red `!` badge shows on the icon, and the tooltip starts with "Pixaloy cannot inspect this page:" and a reason
   - [ ] After about 3 s the badge goes away, and the tooltip is "Pixaloy: inspect this page" again
2. Open `https://chromewebstore.google.com` in a new tab. Click the icon.
   - [ ] The same badge and reason show, and they clear after about 3 s
3. Open a PDF file in a new tab, for example `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`. Click the icon.
   - [ ] The same badge and reason show, and they clear after about 3 s
4. Open `file:///tmp/pixaloy-blank.html` in a new tab. Do not turn on "Allow access to file URLs" for Pixaloy. Click the icon.
   - [ ] The same badge and reason show, and they clear after about 3 s
5. Look at the page in each of the four tabs.
   - [ ] No page shows a Pixaloy panel, an overlay, or a Chrome error page

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _what actually happened on a fail; why it was skipped. Write the reason text that the tooltip showed for each page._

**Reset.** Close the four tabs from TC-1.2. Keep Pixaloy loaded and pinned.

## Scenario 2: Inspector active on a real site

**Setup.** Run once, for every case in this scenario.

1. Open these five sites, each in its own tab:
   - `https://tailwindcss.com` (dark theme)
   - `https://github.com` (fixed header, strict CSP)
   - `https://developer.mozilla.org` (plain CSS)
   - `https://stripe.com`
   - `https://news.ycombinator.com` (quirks mode)
2. Let each page load fully. Accept or close any cookie banner.

- [ ] Setup complete

### TC-2.1: Hover, pin, arrow keys and Esc work on the 5 Phase 2 sites  ·  🔴 Critical

**Goal.** A real toolbar click starts the inspector on each Phase 2 site, and the panel looks the same on each.

**Steps**

1. Go to the `tailwindcss.com` tab. Click the icon one time.
   - [ ] The panel opens at the bottom right with the "Element" tab and the hint "Hover an element and click to pin it."
2. Move the pointer slowly over the hero heading, a button, and a nav link.
   - [ ] The overlay follows the pointer and draws the box model on the element under it
     - orange margin band, yellow border band, green padding band, blue content box
     - a dark label with the tag, the classes and the size in px
     - the label stays inside the window near the top edge
3. Click a button in the hero.
   - [ ] The page does not follow the link, and the panel shows the pinned element with its tag and grouped values
     - groups: layout, box, typography, colour, effects
     - the outline is thicker than the hover outline
4. Press Up arrow two times, Down arrow one time, then Right arrow and Left arrow.
   - [ ] Each key moves the pin to the parent, the first child, and the siblings, and the page does not scroll by itself
5. Press Esc one time.
   - [ ] The pin goes away, and hover works again
6. Press Esc again.
   - [ ] The panel and the overlay go away
7. Look at the panel during steps 1 to 4 on this dark site.
   - [ ] The panel is legible and keeps its own light theme
     - white background, dark text, blue accent
     - system font, not the site font
     - the tab bar, the buttons and the value rows all read clearly
8. Do steps 1 to 6 on `github.com`. Scroll the page so that the fixed header is over content. Hover the header.
   - [ ] The same sweep is clean on github.com
   - [ ] The overlay and the panel show above the fixed header, not under it
9. Do steps 1 to 6 on `developer.mozilla.org` and on `stripe.com`.
   - [ ] The same sweep is clean on both sites
10. Do steps 1 to 6 on `news.ycombinator.com`. Pin a story title link.
    - [ ] The same sweep is clean on this quirks-mode page, and the overlay lines up with the table cells
11. Compare the panel on the five sites.
    - [ ] The panel has the same size, font, spacing and colours on all five sites
      - no site font, site colour, or site spacing leaks into the panel
      - text in the panel is not larger or smaller on one site

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _what actually happened on a fail, with the site name; why it was skipped_

### TC-2.2: Keyboard focus reaches the panel controls  ·  🟡 Normal

**Goal.** A keyboard user can reach and use each panel control.

**Steps**

1. Go to the `developer.mozilla.org` tab. Click the icon. Click a heading to pin it.
2. Press Tab until the focus goes into the panel. You may need many presses on a long page.
   - [ ] Each panel control gets a visible focus ring in a logical order
     - "Element" tab, "Page" tab, the close button
     - "Copy CSS", "Copy selector", the "Set values only" checkbox, then the value rows
3. With the focus on "Copy CSS", press Enter.
   - [ ] The toast "CSS copied" shows
4. With the focus on the "Page" tab, press Space.
   - [ ] The panel shows the Page tab
5. Hold the pointer on the close button.
   - [ ] The tooltip says "Close (Esc)"
6. Look at the muted grey text in the panel.
   - [ ] All muted text, such as the "set" counts and the hint lines, is easy to read

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _what actually happened on a fail; why it was skipped_

### TC-2.3: A page modal dialog makes the panel inert (known limitation)  ·  🟢 Low

**Goal.** Record how the inspector behaves when the page opens a modal dialog. The expected limitation is that the panel does not respond while the dialog is open.

**Steps**

1. Go to the `github.com` tab. Click the icon so that the panel shows.
2. Open DevTools with F12 (⌥⌘I on macOS). Go to the Console. Paste this line and press Enter.

   ```js
   const d = document.createElement('dialog'); d.innerHTML = '<h2>Test dialog</h2><p>Some text</p><button>OK</button>'; document.body.append(d); d.showModal();
   ```

3. Click on the page so that the focus leaves DevTools. Hover the dialog heading.
   - [ ] The overlay draws on the dialog heading, above the dialog
4. Click a button in the panel, for example the "Page" tab.
   - [ ] The panel does not respond while the dialog is open. This is the expected limitation.
5. Press Esc one time.
   - [ ] Write what happened: the dialog closed, the inspector exited or unpinned, or both
6. If the dialog is still open, run `d.close()` in the Console. If the panel is still on the page, click the "Page" tab.
   - [ ] The panel responds again after the dialog closes

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _the behaviour you saw in steps 3 to 6; mark Pass when the only problem is the inert panel_

### TC-2.4: Exit leaves the page clean, and a new injection works  ·  🔴 Critical

**Goal.** After each exit path the page works as before, no Pixaloy node stays, and the toolbar click starts the inspector again.

**Steps**

1. Go to the `stripe.com` tab. Reload the page. Click the icon. Click the icon again.
   - [ ] The second click removes the panel and the overlay
2. Click the icon. Click the close button (✕) in the panel.
   - [ ] The close button removes the panel and the overlay
3. Click a link or a button on the page.
   - [ ] The page reacts as normal, for example a menu opens or the link goes to a new page
4. Go back to the start page if the link went to a new page. Open DevTools, go to Elements, and press Ctrl+F (⌘F on macOS). Search for `pixaloy`.
   - [ ] The search finds 0 results
5. Click the icon again.
   - [ ] The inspector starts again, and hover and pin work as in TC-2.1
6. Press Esc two times. Go to a different page on the same site with a link. Click the icon.
   - [ ] The inspector starts on the new page
7. Press Esc until the panel goes away.

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _what actually happened on a fail; why it was skipped_

**Reset.** Exit the inspector in all five tabs. Close any DevTools window.

## Scenario 3: Element pinned on a real site

**Setup.** Run once, for every case in this scenario.

1. Open `file:///tmp/pixaloy-blank.html` in its own window. Put it next to the browser window with the test site.
2. Keep the five Phase 2 tabs open. Open the other five Phase 3 sites, each in its own tab:
   - `https://wikipedia.org`
   - `https://airbnb.com` (CSS-in-JS)
   - `https://linear.app`
   - `https://bbc.com`
   - `https://vercel.com`

- [ ] Setup complete

### TC-3.1: Copied CSS renders the same in the blank page on 10 sites  ·  🔴 Critical

**Goal.** On each of the 10 Phase 3 sites, the copied CSS of one chosen element renders the same in a blank page.

**Steps**

1. On the first site, click the icon. Pin an element with clear styles, such as a primary button, a badge, or a heading.
2. Note the tag in the panel, for example `a` or `h1`. Note the text of the element.
3. Click "Copy CSS".
   - [ ] The toast "CSS copied" shows at the bottom of the panel and goes away after about 2 s
4. In the blank page, type the tag in "Tag" and the text in "Text". Paste the CSS in the box. Click "Render".
   - [ ] The rendered element looks the same as the element on the site
     - background, text colour, font family, font size and weight
     - padding, border, border radius, shadow
     - width and height, when the element has a fixed size
     - a small difference from a missing web font or a parent layout is acceptable; write it in Notes
5. Write one line in Notes for this site: the site, the element, and the verdict.
6. Do steps 1 to 5 on the other nine sites.
   - [ ] The same check is clean on all 10 sites
   - [ ] On `news.ycombinator.com` (quirks mode) the copy does not lose the font size or the table text styles

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _one line per site: site · element · same / small difference / different, and what differed_

- tailwindcss.com:
- github.com:
- developer.mozilla.org:
- stripe.com:
- news.ycombinator.com:
- wikipedia.org:
- airbnb.com:
- linear.app:
- bbc.com:
- vercel.com:

### TC-3.2: Copied selector is unique and has no hashed class; one value copies  ·  🟡 Normal

**Goal.** The copied selector finds exactly the pinned element, avoids generated class names, and a value row copies one value.

**Steps**

1. Go to the `airbnb.com` tab. Pin a listing card title or a search button. Click "Copy selector".
   - [ ] The toast "Selector copied" shows
2. Open DevTools on the same tab. In the Console, type the line below. Paste the selector between the quotes. Press Enter.

   ```js
   document.querySelectorAll('PASTE_SELECTOR_HERE').length === 1
   ```

   - [ ] The Console shows `true`
3. Read the pasted selector.
   - [ ] The selector has no class that looks generated, such as a mix of random letters and digits (`c1abc2d`, `atm_9s_1txwivl`, `css-1x2y3z`)
4. Do steps 1 and 2 on `github.com` and on `wikipedia.org`.
   - [ ] The Console shows `true` on both sites
5. In the panel on the last site, click one value row, for example `font-size`. Paste in the Console input or in any text field.
   - [ ] The toast "Value copied" shows, and the paste is only the value, such as `16px`, with no property name

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _write each selector you tested; what actually happened on a fail_

**Reset.** Exit the inspector in all tabs. Close the blank page window. Close DevTools.

## Scenario 4: Page tab open on a real site

**Setup.** Run once, for every case in this scenario.

1. Keep the `developer.mozilla.org`, `github.com` and `wikipedia.org` tabs open.
2. Open `https://en.wikipedia.org/wiki/List_of_sovereign_states` in a new tab. This is the heavy page.

- [ ] Setup complete

### TC-4.1: Colours and fonts agree with DevTools on 3 sites  ·  🟡 Normal

**Goal.** On three sites, the Page tab lists the colours and the font stack that DevTools shows for five sampled elements.

**Steps**

1. Go to the `developer.mozilla.org` tab. Click the icon. Click the "Page" tab.
   - [ ] The scan finishes and shows a line with the colour count, the font count, and the visible element count
   - [ ] Each colour row shows a swatch, HEX, RGB, HSL and OKLCH values, and a count, and the values agree with the swatch
   - [ ] The font list ends with the note that the rendered font comes in a later version
2. Pick five visible elements with different colours, such as body text, a link, a heading, a button, and a coloured background. For each one, open DevTools, select it in Elements, and open the "Computed" tab.
   - [ ] Each `color`, `background-color`, and visible border colour from DevTools is in the Page tab colour list
   - [ ] Each `font-family` stack of the elements with text is in the Page tab font list
3. Pin one of the five elements, then click the "Page" tab.
   - [ ] "Pinned element" shows the same `font-size`, `font-weight` and `line-height` as DevTools Computed
4. Click a HEX value, then click a font stack. Paste each one into a text field.
   - [ ] Each click shows a toast and copies only that value
5. Do steps 1 to 3 on `github.com` and on `wikipedia.org`.
   - [ ] The same check is clean on both sites

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _for each site, write any DevTools colour or font that the list did not have_

### TC-4.2: The scan keeps a heavy page responsive  ·  🟡 Normal

**Goal.** The Page tab scan on a large page does not freeze the page.

**Steps**

1. Go to the heavy Wikipedia tab. Click the icon. Click the "Page" tab.
   - [ ] The panel shows "Scanning the page…" with a count that goes up
2. While the scan runs, scroll the page with the mouse wheel. Hover some table cells.
   - [ ] The page scrolls without a stop longer than about half a second, and the overlay follows the pointer
3. Wait for the scan to finish.
   - [ ] The colour list and the font list show, and the scan takes less than about 30 s
4. Click "Element", then click "Page" again. Click "Rescan".
   - [ ] Each new scan starts and finishes with no error
5. Press Esc until the panel goes away. Scroll the page.
   - [ ] The page scrolls as fast as before the inspector started

**Result**

- [ ] Pass
- [ ] Fail
- [ ] Skipped

**Notes.** _write the element count and about how long the scan took_

**Reset.** Exit the inspector in all tabs. Close the test tabs. To remove the build, click "Remove" on the Pixaloy card in `chrome://extensions`.

## Automated verification (by AI agent)
_Checks the agent ran itself. No action needed from the tester; listed here for context and sign-off._

The orchestrator ran the full gate on HEAD `a84f931` with the same uncommitted MVP tree. HEAD is now `93479d8`. Commit `93479d8` and the only uncommitted difference change `docs/plans/0001-plan-pixaloy-mvp-2026-10-04.md` headings only, so the gate result applies to this tree. This agent did not run the gate again.

Commands run (one per block; chain with `&&` when they must run together):

```sh
pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build && pnpm zip && pnpm test:e2e
```

```sh
pnpm screenshots
```

```sh
actionlint .github/workflows/release.yml .github/workflows/ci.yml
```

```sh
cat .output/chrome-mv3/manifest.json
```

```sh
unzip -l .output/pixaloy-0.1.0-chrome.zip
```

```sh
wc -c store/description.txt
```

- ✅ Full gate (reused, ran on `a84f931` with the same tree) → exit 0. Vitest: 11 files, 132 tests passed. Playwright: 12 tests passed.
- ✅ Built manifest (reused gate, and read again by this agent) → MV3, version 0.1.0, permissions exactly `activeTab`, `scripting`, `storage`, no `host_permissions`, no `content_scripts`, icons 16, 32, 48 and 128, action title "Pixaloy: inspect this page".
- ✅ `pnpm screenshots` (run by the asset agent) → 4 tests passed.
- ✅ actionlint on `release.yml` and `ci.yml` (run by the orchestrator) → no errors.
- ✅ `unzip -l` (this agent) → the zip holds 7 files: `manifest.json`, `background.js`, `content-scripts/inspector.js`, and the four icons. It has no source map and no test file.
- ✅ `wc -c store/description.txt` (this agent) → 125 bytes, under the 132-character limit.

The E2E suite already covers these flows on local fixture pages. The E2E build uses a test-only host permission in place of a real toolbar click.

- `smoke.spec.ts`: the built extension loads and its service worker registers
- `inspector.spec.ts`: action click injects; hover, pin, arrows, Esc unpin then exit with full teardown
- `inspector.spec.ts`: a second action click removes the inspector, and a third injects it again
- `inspector.spec.ts`: the inspector ignores its own host when hit-testing
- `inspector.spec.ts`: the overlay stays above a modal dialog the page opens later
- `inspector.spec.ts`: an already open modal dialog stays below the injected inspector
- `inspector.spec.ts`: a restricted page (`chrome://version`) gets a ! badge and a reason for 3 s
- `copy.spec.ts`: under a strict CSP, copy CSS keeps box-sizing and collapses the shorthands
- `copy.spec.ts`: copy selector round-trips, skips hashed classes, and a row copies one value
- `copy.spec.ts`: a blocked clipboard shows the text in a selected box
- `page.spec.ts`: lists the fixture colours and fonts with exact counts, and copies them
- `page.spec.ts`: scans 10,000 elements in idle chunks without blocking the page

## Not covered / needs human judgment
- Owner steps out of scope for this plan: the Google account, the CWS registration and fee, the store listing, store review, publish, a run of the release workflow, and GitHub Pages for the privacy policy. `docs/release.md` lists them.
- Edge and Firefox are not tested. The MVP supports Chrome only.
- Elements inside iframes are not tested. The MVP does not support them.
- Elements inside a page's shadow DOM are not tested. Shadow DOM elements come in v2.
- The blocked-clipboard box is not tested on a real site. The E2E suite covers it on a fixture page, and no Phase 3 site is known to block the clipboard.
- A screen reader pass is not in this plan. TC-2.2 checks the keyboard and the contrast only.
- The data layer is not tested. Pixaloy has no database, no server, and no network call.
- Concurrency is checked only by the double toolbar click in TC-2.4. Pixaloy has no shared state between tabs.

## Overall result
_Tick one when you finish the run._

- [ ] Pass: every case passed
- [ ] Fail: at least one case failed
- [ ] Partial: cases were skipped or not reached
