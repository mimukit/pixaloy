import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const manifestPath = resolve(root, '.output/chrome-mv3/manifest.json');

interface BuiltManifest {
  manifest_version: number;
  name: string;
  description: string;
  version: string;
  permissions?: string[];
  host_permissions?: string[];
  optional_permissions?: string[];
  optional_host_permissions?: string[];
  icons?: Record<string, string>;
  action?: {
    default_title?: string;
    default_popup?: string;
    default_icon?: Record<string, string>;
  };
  background?: { service_worker?: string };
  content_scripts?: unknown[];
  web_accessible_resources?: unknown[];
}

let manifest: BuiltManifest;

/** Read width and height from a PNG's IHDR chunk: bytes 16 to 23, big-endian. */
function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file);
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(bytes.toString('latin1', 12, 16)).toBe('IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// Build the extension first, so `pnpm test` checks the real output on its own.
beforeAll(() => {
  execFileSync(resolve(root, 'node_modules/.bin/wxt'), ['build'], { cwd: root, stdio: 'pipe' });
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BuiltManifest;
}, 120_000);

describe('built manifest', () => {
  it('is Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Pixaloy');
  });

  it('lists exactly activeTab, scripting and storage', () => {
    expect([...(manifest.permissions ?? [])].sort()).toEqual(['activeTab', 'scripting', 'storage']);
    expect(manifest.optional_permissions).toBeUndefined();
  });

  it('has no host permissions', () => {
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.optional_host_permissions).toBeUndefined();
  });

  it('has a description of 132 characters or fewer', () => {
    expect(manifest.description.length).toBeGreaterThan(0);
    expect(manifest.description.length).toBeLessThanOrEqual(132);
  });

  it('has an action with no popup, so a toolbar click fires action.onClicked', () => {
    expect(manifest.action?.default_title).toBeTruthy();
    expect(manifest.action?.default_popup).toBeUndefined();
  });

  it('lists no content script: the inspector is injected on a toolbar click only', () => {
    expect(manifest.content_scripts).toBeUndefined();
    expect(manifest.web_accessible_resources).toBeUndefined();
    expect(existsSync(resolve(root, '.output/chrome-mv3/content-scripts/inspector.js'))).toBe(true);
  });

  it('lists the 16, 32, 48 and 128 px icons, and the toolbar sizes on the action', () => {
    expect(manifest.icons).toEqual({
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    });
    expect(manifest.action?.default_icon).toEqual({
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
    });
  });

  it.each([16, 32, 48, 128])('ships icon/%i.png as a square PNG of that size', (size) => {
    expect(pngSize(resolve(root, `.output/chrome-mv3/icon/${size}.png`))).toEqual({
      width: size,
      height: size,
    });
  });

  it('registers a background service worker', () => {
    expect(manifest.background?.service_worker).toBe('background.js');
  });

  it('matches the package.json version', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      version: string;
    };
    expect(manifest.version).toBe(pkg.version);
  });
});
