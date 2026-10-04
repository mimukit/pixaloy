import { HOST_TAG } from '../shared/constants';
import { BASELINE_FRAME_ATTRIBUTE } from './baseline';

/** The parts of a DOM element the guard reads. Kept small so tests can fake it. */
interface GuardNode {
  localName: string;
  hasAttribute(name: string): boolean;
  getRootNode(): unknown;
  ownerDocument: { defaultView: { frameElement: unknown } | null } | null;
}

function isGuardNode(value: unknown): value is GuardNode {
  return typeof value === 'object' && value !== null && 'localName' in value;
}

/**
 * Whether `element` belongs to Pixaloy: the inspector host, anything in its
 * shadow tree (the panel, the overlay, the baseline iframe), or an element
 * inside the baseline iframe's document. The style engine and the page scans
 * skip these.
 */
export function isPixaloyNode(element: GuardNode): boolean {
  let current: unknown = element;
  for (let depth = 0; isGuardNode(current) && depth < 32; depth += 1) {
    if (current.localName === HOST_TAG || current.hasAttribute(BASELINE_FRAME_ATTRIBUTE)) {
      return true;
    }
    const root = current.getRootNode();
    if (typeof root === 'object' && root !== null && 'host' in root) {
      current = (root as { host: unknown }).host;
      continue;
    }
    // A document root: an element in the baseline iframe has it as frameElement.
    current = current.ownerDocument?.defaultView?.frameElement ?? null;
  }
  return false;
}
