import type { CSSProperties } from 'react';
import {
  describeElement,
  formatSize,
  measureBoxModel,
  type Edges,
  type Rect,
} from '../inspector/geometry';
import { selectTarget } from '../inspector/store';
import { useInspector } from './store-context';

// DevTools-like box colours. Each band is drawn as a frame of its edge widths.
const BAND_COLORS = {
  margin: 'rgb(246 178 107 / 0.55)',
  border: 'rgb(255 229 153 / 0.65)',
  padding: 'rgb(147 196 125 / 0.55)',
  content: 'rgb(111 168 220 / 0.55)',
};

function place(rect: Rect): CSSProperties {
  return { left: rect.x, top: rect.y, width: rect.width, height: rect.height };
}

function frame(edges: Edges, color: string): CSSProperties {
  const clamp = (value: number) => Math.max(0, value);
  return {
    borderStyle: 'solid',
    borderColor: color,
    borderWidth: `${clamp(edges.top)}px ${clamp(edges.right)}px ${clamp(edges.bottom)}px ${clamp(edges.left)}px`,
  };
}

/** The box model outline and label of the hovered or pinned element. */
export function Overlay() {
  const target = useInspector(selectTarget);
  const pinned = useInspector((state) => state.pinned !== null);
  // Subscribing re-renders on scroll and resize, so the boxes follow the page.
  useInspector((state) => state.layoutVersion);

  if (!target || !target.isConnected) return null;

  const box = measureBoxModel(target);
  const { tag, classes } = describeElement(target);
  const labelBelow = box.border.y < 28;

  return (
    <div data-pixaloy="overlay" className="pointer-events-none fixed inset-0">
      <div
        data-box="margin"
        className="absolute"
        style={{ ...place(box.margin), ...frame(box.marginEdges, BAND_COLORS.margin) }}
      />
      <div
        data-box="border"
        className="absolute"
        style={{ ...place(box.border), ...frame(box.borderEdges, BAND_COLORS.border) }}
      />
      <div
        data-box="padding"
        className="absolute"
        style={{ ...place(box.padding), ...frame(box.paddingEdges, BAND_COLORS.padding) }}
      />
      <div
        data-box="content"
        className="absolute"
        style={{ ...place(box.content), background: BAND_COLORS.content }}
      />
      <div
        data-box="outline"
        className={`absolute ${pinned ? 'outline-2 outline-accent' : 'outline-1 outline-accent/70'}`}
        style={place(box.border)}
      />
      <div
        data-pixaloy="label"
        className="absolute flex max-w-[480px] items-baseline gap-2 truncate rounded-sm bg-ink px-2 py-1 font-mono text-xs text-white shadow-panel"
        style={{
          left: Math.max(4, box.border.x),
          top: labelBelow ? box.border.y + box.border.height + 6 : box.border.y - 26,
        }}
      >
        <span>
          <span data-pixaloy="tag" className="font-semibold text-tag">
            {tag}
          </span>
          {classes.length > 0 && (
            <span data-pixaloy="classes" className="text-class">
              .{classes.join('.')}
            </span>
          )}
        </span>
        <span data-pixaloy="size" className="text-white/70">
          {formatSize(box.border.width, box.border.height)}
        </span>
      </div>
    </div>
  );
}
