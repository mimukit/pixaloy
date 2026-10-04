import { describe, expect, it } from 'vitest';
import { splitShadowCss } from '../../src/inspector/shadow-css';

const css = `
@layer theme { :root, :host { --spacing: 4px; } }
.p-2 { padding: calc(var(--spacing) * 2); }
@property --tw-shadow { syntax: "*"; inherits: false; initial-value: 0 0 #0000; }
@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}
`;

describe('splitShadowCss', () => {
  it('moves :root rules to :host', () => {
    const { shadowCss } = splitShadowCss(css);
    expect(shadowCss).not.toContain(':root');
    expect(shadowCss).toContain(':host, :host { --spacing: 4px; }');
    expect(shadowCss).toContain('.p-2');
  });

  it('extracts every @property rule for the document', () => {
    const { shadowCss, propertyCss } = splitShadowCss(css);
    expect(shadowCss).not.toContain('@property');
    expect(propertyCss).toContain('@property --tw-shadow {');
    expect(propertyCss).toContain('@property --tw-border-style{');
    expect(propertyCss.match(/@property/g)).toHaveLength(2);
  });

  it('returns no document CSS when there is no @property rule', () => {
    expect(splitShadowCss('.a { color: red }').propertyCss).toBe('');
  });
});
