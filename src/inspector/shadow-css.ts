/**
 * Tailwind v4 in a shadow root needs two fixes:
 *
 * - Theme variables are declared on `:root`, which does not match inside a
 *   shadow root. They move to `:host`.
 * - `@property` rules are ignored inside a shadow root. They must be
 *   registered on the document, so they go into `document.adoptedStyleSheets`.
 *   Registrations cannot be undone, so they stay after exit (a known risk in
 *   the plan). The sheet is added once per document.
 */

const PROPERTY_RULE = /@property\s+[\w-]+\s*\{[^{}]*\}/g;

export interface SplitCss {
  /** CSS for the shadow root, with `:root` rewritten to `:host`. */
  shadowCss: string;
  /** The `@property` rules, for the document. */
  propertyCss: string;
}

export function splitShadowCss(css: string): SplitCss {
  const propertyCss = (css.match(PROPERTY_RULE) ?? []).join('\n');
  const shadowCss = css.replace(PROPERTY_RULE, '').replaceAll(':root', ':host').trim();
  return { shadowCss, propertyCss };
}

const ADOPTED_FLAG = '__pixaloyPropertySheet';

/** Register the `@property` rules on the document once. */
export function adoptPropertyRules(propertyCss: string, doc: Document = document): void {
  if (!propertyCss) return;
  const scope = globalThis as Record<string, unknown>;
  const existing = scope[ADOPTED_FLAG] as CSSStyleSheet | undefined;
  if (existing && doc.adoptedStyleSheets.includes(existing)) return;

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(propertyCss);
  doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
  scope[ADOPTED_FLAG] = sheet;
}
