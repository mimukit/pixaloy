# AGENTS.md

## Project

Pixaloy is a Chrome extension (Manifest V3) that inspects CSS on a live page, copies an element's minimized styles, and lists page colours and fonts. Stack: WXT, TypeScript, React 19, Tailwind v4 in a shadow root, zustand, Vitest, Playwright. Package manager: pnpm.

## Build and test

- `pnpm install`
- `pnpm typecheck`, `pnpm lint`, `pnpm test`
- `pnpm build`, `pnpm zip`

## Rules for agents

- Do not add a network call, analytics, or remote code. All processing stays on the device.
- Do not add a manifest permission beyond `activeTab`, `scripting`, `storage` without an explicit ask.
- Keep the style engine a plain TypeScript module with no UI framework import.
- Use pnpm only. Do not commit a lockfile from another package manager.

## Docs artifact naming

- An artifact under `docs/<type>/` (a plan, a QA plan, a review, research) is named `NNNN-<type>-<slug>-YYYY-MM-DD.md`.
- `NNNN` is a four-digit serial, per directory, assigned in creation order and never reused. To get it, list the directory, take the highest serial, and add one. An empty directory starts at `0001`.
- `YYYY-MM-DD` is the creation date. The whole name stays fixed after edits.
- An ADR uses its decision number as the serial: `docs/adr/NNNN-adr-<slug>-YYYY-MM-DD.md`.
- Reader-facing pages (`docs/wiki/`, how-to guides, runbooks) stay unnumbered.
