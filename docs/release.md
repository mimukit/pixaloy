# Release runbook

How Pixaloy gets to the Chrome Web Store (CWS). Part 1 is the first publish, done by hand in the CWS Developer Dashboard. Part 2 is every later release, done by CI from a git tag on CWS API v2.

The steps come from Phases 5, 6 and 7 of [the MVP plan](plans/0001-plan-pixaloy-mvp-2026-10-04.md) and section 7 of [the research report](research/2026-10-04-research-features-stack-publish.md). This page is a draft. Fill in each "Notes" line as you do the step: the date, what the dashboard showed, and anything that differed from these steps.

## Part 1: First publish (manual)

The CWS API cannot create a new item, so the first upload is by hand. Steps 2 to 5 have no code dependency, so you can start them early.

### Prepare

- [ ] 1. Search the Chrome Web Store for "Pixaloy" and confirm that no item uses the name.
  - Notes:
- [ ] 2. Create a dedicated Google account for publishing. Turn on 2-Step Verification, with a hardware key if you have one. The account email cannot change after registration, and one account gets one publisher.
  - Notes:
- [ ] 3. Register in the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole) and pay the one-time US$5 fee.
  - Notes:
- [ ] 4. In the dashboard Account section, declare non-trader status (EU DSA). Pixaloy is a free hobby project with no revenue.
  - Notes:
- [ ] 5. In the same section, set and verify the contact email.
  - Notes:
- [ ] 6. Turn on GitHub Pages for the repo: Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/docs`. Check that https://mimukit.github.io/pixaloy/privacy/ shows the policy from `docs/privacy/index.md`.
  - Notes:

### Build the package and assets

- [ ] 7. On `main`, run `pnpm install`, then `pnpm zip`. Upload the file `.output/pixaloy-0.1.0-chrome.zip`. Check that `package.json` and the built manifest both say `0.1.0`.
  - Notes:
- [ ] 8. Check the graphic assets in `store/`: three 1280x800 screenshots in `store/screenshots/` and the 440x280 tile `store/promo-tile-440x280.png`. If the UI changed since they were made, run `pnpm screenshots` to make them again. The 128x128 store icon is `public/icon/128.png`, which `pnpm icons` renders from `assets/icon.svg`. [`store/README.md`](../store/README.md) lists each file.
  - Notes:

### Create the item

- [ ] 9. In the dashboard, click "New item" and upload the zip from step 7.
  - Notes:
- [ ] 10. Fill in the Store listing tab from [`store/listing.md`](../store/listing.md) and [`store/detailed-description.txt`](../store/detailed-description.txt). Upload the screenshots and the promo tile from step 8.
  - Notes:
- [ ] 11. Fill in the Privacy tab from [`store/single-purpose.md`](../store/single-purpose.md) and [`store/permissions.md`](../store/permissions.md): the single purpose, one justification each for `activeTab`, `scripting` and `storage`, "No" for remote code, the data usage boxes, the three certifications, and the privacy policy URL https://mimukit.github.io/pixaloy/privacy/.
  - Notes:
- [ ] 12. Fill in the Distribution tab: free, all regions. Set visibility to Private and add your own account as a trusted tester.
  - Notes:
- [ ] 13. Submit for review. Record the date.
  - Notes:
- [ ] 14. After approval, install Pixaloy from the CWS listing as a trusted tester in a clean Chrome profile. Repeat the Phase 2 to 4 checks on the store build.
  - Notes:

### Go public

- [ ] 15. Change visibility to Public.
  - Notes:
- [ ] 16. Turn off auto-publish ("Publish automatically after review"), so the item waits for you after approval.
  - Notes:
- [ ] 17. Submit for review. If the review rejects the item, record the violation code (for example Purple Potassium for an unused permission), fix it, and resubmit or appeal from the dashboard.
  - Notes:
- [ ] 18. After approval, click Publish. A deferred publish expires 30 days after approval.
  - Notes:
- [ ] 19. Install from the public CWS URL in a clean Chrome profile. Record the item ID and the public URL here.
  - Notes:
- [ ] 20. Tag the commit you built the store zip from as `v0.1.0`, and push the tag:

  ```sh
  git tag v0.1.0
  git push origin v0.1.0
  ```

  The release workflow builds and zips `0.1.0`, writes the SHA-256, and creates GitHub Release `v0.1.0` with both files. The `CHROME_EXTENSION_ID` secret does not exist yet, so the workflow skips the store submit and logs a notice. Do this step before Part 2. If the secrets already exist, the workflow tries to submit `0.1.0` again, and the store rejects a version it already has.

  CI rebuilds the zip from the tag, so its checksum can differ from the file you uploaded by hand. Compare the two `sha256sum` values and record the result here.
  - Notes:

## Part 2: CI release (API v2)

After the first approval, every release goes through [`.github/workflows/release.yml`](../.github/workflows/release.yml). It uses CWS API v2 with a Google Cloud service account. CWS API v1.1 stops on 2026-10-15, so do not set up OAuth client credentials or a refresh token.

### One-time setup

- [ ] 1. In the [Google Cloud console](https://console.cloud.google.com/), create a project for Pixaloy publishing, signed in with the publisher account from Part 1.
  - Notes:
- [ ] 2. In that project, enable the Chrome Web Store API (APIs and Services, Library).
  - Notes:
- [ ] 3. Create a service account (IAM and Admin, Service Accounts). It needs no project role.
  - Notes:
- [ ] 4. Create a JSON key for the service account and download it. Keep it out of the repo and delete the local copy after step 7.
  - Notes:
- [ ] 5. In the CWS Developer Dashboard, Account section, add the service account email. CWS allows one service account per publisher.
  - Notes:
- [ ] 6. Copy the publisher ID from the dashboard Account section, and the extension item ID from the item page.
  - Notes:
- [ ] 7. In GitHub, Settings, Environments, create an environment named `release`. Add these four environment secrets:

  | Secret | Value |
  |--------|-------|
  | `CHROME_EXTENSION_ID` | The item ID from step 6 |
  | `CHROME_PUBLISHER_ID` | The publisher ID from step 6 |
  | `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | `client_email` from the JSON key |
  | `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` from the JSON key, with real line breaks |

  The private key must contain real line breaks, not the two characters `\n`. `publish-browser-extension` 6.1.1 converts `\n` only in its interactive `init` command, not when it reads the environment. The safe way is `jq -r .private_key key.json | gh secret set CHROME_SERVICE_ACCOUNT_PRIVATE_KEY --env release`.
  - Notes:
- [ ] 8. Protect the `release` environment: add yourself as a required reviewer, and limit deployment to tags that match `v*`.
  - Notes:

### Each release

- [ ] 1. Set the new version in `package.json`, for example `0.1.1`. WXT copies it into the manifest. Commit the change and merge it to `main`.
  - Notes:
- [ ] 2. Tag the commit with the same version and a `v` prefix, then push the tag:

  ```sh
  git tag v0.1.1
  git push origin v0.1.1
  ```

  - Notes:
- [ ] 3. Approve the `release` deployment in the Actions tab.
  - Notes:
- [ ] 4. Check the result. The CWS dashboard shows the new version in review or published, and the GitHub Release `v0.1.1` has the zip and its `.sha256` file.
  - Notes:

### What the workflow does

The workflow runs only when a tag that matches `v*` is pushed. It never runs on a branch push or a pull request. The job uses the `release` environment and has `contents: write` permission.

1. It checks out the tag, sets up pnpm and Node 24, and runs `pnpm install --frozen-lockfile`.
2. It compares the `package.json` version with the tag minus the `v`. A mismatch fails the run before anything is built.
3. It runs `pnpm build` and `pnpm zip`, and checks that there is exactly one `.output/*-chrome.zip`.
4. If the `CHROME_EXTENSION_ID` secret is empty, it skips the submit and logs a notice. Otherwise it runs `pnpm wxt submit --chrome-zip <zip>` with `CHROME_API_VERSION=v2` and the four secrets. Without `CHROME_API_VERSION=v2`, `wxt submit` uses API v1.1, which stops on 2026-10-15.
5. It writes `<zip>.sha256` with `sha256sum`.
6. It creates the GitHub Release for the tag with generated notes, and attaches the zip and the checksum. If the release already exists, it uploads both files with `--clobber`.

`wxt submit` reads the environment variables listed in `publish-browser-extension` 6.1.1 (`dist/init-*.mjs`, function `resolveConfig`). To test the credentials without an upload, run the same command locally with `--dry-run` and the variables in a git-ignored `.env.submit` file.

### Later hardening

GitHub OIDC with workload identity federation can replace the service account key. This is a later step, not part of the MVP.
