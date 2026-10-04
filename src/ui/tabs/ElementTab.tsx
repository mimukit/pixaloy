import { useState } from 'react';
import { extractStyles, uniqueSelector, type StyleGroup } from '../../engine';
import { describeElement, formatSize } from '../../inspector/geometry';
import { useBaseline } from '../baseline-context';
import { useCopy } from '../copy/CopyProvider';
import { useInspector } from '../store-context';

const ACTION_CLASS =
  'rounded-sm border border-line px-2 py-1 text-sm font-medium hover:bg-hover active:bg-accent-soft';

function Group({ group, changedOnly }: { group: StyleGroup; changedOnly: boolean }) {
  const copy = useCopy();
  const rows = changedOnly ? group.rows.filter((row) => row.changed) : group.rows;
  const changedCount = group.rows.filter((row) => row.changed).length;
  return (
    <details open data-pixaloy="style-group" data-group={group.id} className="group">
      <summary className="flex cursor-pointer items-center gap-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase select-none">
        {group.label}
        <span className="font-normal normal-case">{changedCount} set</span>
      </summary>
      {rows.length === 0 ? (
        <p className="pb-1 pl-2 text-xs text-muted">All values are defaults.</p>
      ) : (
        <ul className="pb-1">
          {rows.map((row) => (
            <li key={row.property}>
              <button
                type="button"
                data-pixaloy="style-row"
                data-property={row.property}
                data-changed={row.changed}
                title={`Copy the ${row.property} value`}
                onClick={() => void copy(row.value, 'Value')}
                className={`flex w-full gap-2 rounded-sm px-2 py-px text-left font-mono text-xs hover:bg-hover ${
                  row.changed ? 'text-ink' : 'text-muted'
                }`}
              >
                <span className="shrink-0 text-accent">{row.property}</span>
                <span className="min-w-0 break-all">{row.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

/** Element tab: the pinned element, its copy actions and its computed values in groups. */
export function ElementTab() {
  const pinned = useInspector((state) => state.pinned);
  // Subscribing re-reads the styles after a scroll or a resize.
  useInspector((state) => state.layoutVersion);
  const baseline = useBaseline();
  const copy = useCopy();
  const [changedOnly, setChangedOnly] = useState(true);

  if (!pinned || !pinned.isConnected) {
    return (
      <p data-pixaloy="hint" className="text-sm text-muted">
        Hover an element and click to pin it.
      </p>
    );
  }

  const { tag, classes } = describeElement(pinned);
  const rect = pinned.getBoundingClientRect();
  const report = extractStyles(pinned, { baseline });

  return (
    <div data-pixaloy="element-details" className="flex flex-col gap-2">
      <div>
        <p className="truncate font-mono text-sm">
          <span data-pixaloy="pinned-tag" className="font-semibold text-accent">
            {tag}
          </span>
          {classes.length > 0 && <span className="text-muted">.{classes.join('.')}</span>}
        </p>
        <p className="text-xs text-muted">
          {formatSize(rect.width, rect.height)} · ↑ parent · ↓ child · ← → siblings · Esc unpin
        </p>
      </div>
      {report && (
        <>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              data-pixaloy="copy-css"
              className={ACTION_CLASS}
              onClick={() => void copy(report.css, 'CSS')}
            >
              Copy CSS
            </button>
            <button
              type="button"
              data-pixaloy="copy-selector"
              className={ACTION_CLASS}
              onClick={() => void copy(uniqueSelector(pinned), 'Selector')}
            >
              Copy selector
            </button>
            <label className="ml-auto flex items-center gap-1 text-xs text-muted">
              <input
                type="checkbox"
                data-pixaloy="changed-only"
                checked={changedOnly}
                onChange={(event) => setChangedOnly(event.target.checked)}
              />
              Set values only
            </label>
          </div>
          <div className="flex flex-col">
            {report.groups.map((group) => (
              <Group key={group.id} group={group} changedOnly={changedOnly} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
