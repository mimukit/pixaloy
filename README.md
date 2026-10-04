# Pixaloy

A free, open-source Chrome extension that inspects CSS on a live page, copies an element's styles, and lists the page's colours and fonts. Everything runs on your device.

## Status

Pre-release. The MVP plan is in [docs/plans/0001-plan-pixaloy-mvp-2026-10-04.md](docs/plans/0001-plan-pixaloy-mvp-2026-10-04.md).

## Privacy

Pixaloy makes no network calls and collects no analytics. It asks only for the `activeTab`, `scripting` and `storage` permissions.

## Not for sale

Pixaloy is free and stays free. There is no account, no paid tier and no paywall.

## Development

Pixaloy uses [WXT](https://wxt.dev) with React and TypeScript, and pnpm.

```sh
pnpm install
pnpm dev        # start Chrome with the extension loaded
pnpm test       # run the Vitest suite
pnpm zip        # build the Chrome Web Store zip
```

These commands work once the WXT scaffold lands (plan Phase 1).

## License

[MIT](LICENSE)
