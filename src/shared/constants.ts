/** Tag name of the shadow host that holds the whole inspector UI. */
export const HOST_TAG = 'pixaloy-inspector';

/**
 * Key on the content script's isolated-world `globalThis` while the inspector
 * is active. The page cannot see it. The service worker probes it to toggle.
 */
export const ACTIVE_KEY = '__pixaloyInspector';

/** Bundle path of the runtime-registered inspector content script. */
export const INSPECTOR_SCRIPT = '/content-scripts/inspector.js' as const;

/** How long the `!` badge stays on a tab after a failed injection. */
export const BADGE_CLEAR_MS = 3000;

export interface ActiveInspector {
  teardown: () => void;
}
