---
title: Pixaloy privacy policy
permalink: /privacy/
---

# Pixaloy privacy policy

Last updated: 2026-10-04

Pixaloy is a free, open-source (MIT) Chrome extension that inspects the CSS of the page you are on. This page says what it does with your data. The short answer: it keeps everything on your device.

## What Pixaloy reads

When you click the Pixaloy toolbar icon, Pixaloy runs on the current tab only. It reads the page's elements and their computed styles so it can draw the box-model overlay, show style values, and list the page's colours and fonts. It does this inside your browser, and only while the inspector is open on that tab.

## What Pixaloy collects and sends

Nothing. Pixaloy makes no network requests. It has no analytics, no tracking, no ads, no account, and no server. It does not collect, sell, or share any personal data or page content, and it does not send anything to the developer or to any third party.

## What Pixaloy stores

Pixaloy has the Chrome `storage` permission. It may store your Pixaloy settings locally in your browser's extension storage on your device. It never stores page content there, and it does not sync anything to a remote server. Removing the extension removes this storage.

## Clipboard

Pixaloy writes to your clipboard only when you click one of its copy buttons. It never reads your clipboard.

## Permissions

Pixaloy asks for three Chrome permissions:

- `activeTab`: access to the current tab, only after you click the toolbar icon.
- `scripting`: to add the inspector to that tab when you click the icon.
- `storage`: to keep your Pixaloy settings on your device.

It has no host permissions, so it cannot run on a site until you click the icon there. It loads no remote code.

## Changes to this policy

If this policy changes, the new version will appear on this page with a new date. The full history is in the [Pixaloy repository](https://github.com/mimukit/pixaloy).

## Contact

Questions or concerns: open an issue at [github.com/mimukit/pixaloy/issues](https://github.com/mimukit/pixaloy/issues).
