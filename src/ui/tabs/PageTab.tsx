import { useEffect, useState } from 'react';
import {
  fontMetrics,
  scanPage,
  type ColourFormats,
  type FontEntry,
  type PaletteEntry,
  type PageScanResult,
  type ScanProgress,
} from '../../engine';
import { useCopy } from '../copy/CopyProvider';
import { useInspector } from '../store-context';

const FORMATS: ReadonlyArray<keyof ColourFormats> = ['hex', 'rgb', 'hsl', 'oklch'];

const HEADING_CLASS = 'py-1 text-xs font-semibold tracking-wide text-muted uppercase';
const VALUE_CLASS =
  'block w-full truncate rounded-sm px-1 text-left font-mono text-xs hover:bg-hover';

type ScanState =
  | { status: 'scanning'; progress: ScanProgress | null }
  | { status: 'done'; result: PageScanResult }
  | { status: 'failed' };

function ColourRow({ entry }: { entry: PaletteEntry }) {
  const copy = useCopy();
  return (
    <li data-pixaloy="colour" data-key={entry.key} className="flex items-start gap-2 py-1">
      <span
        aria-hidden
        className="mt-px size-5 shrink-0 rounded-sm border border-line"
        style={{ background: entry.swatch }}
      />
      <div className="min-w-0 flex-1">
        {FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            data-pixaloy="colour-value"
            data-format={format}
            title={`Copy the ${format.toUpperCase()} value`}
            onClick={() => void copy(entry.formats[format], 'Colour')}
            className={VALUE_CLASS}
          >
            {entry.formats[format]}
          </button>
        ))}
      </div>
      <span data-pixaloy="colour-count" className="shrink-0 font-mono text-xs text-muted">
        {entry.count}
      </span>
    </li>
  );
}

function FontRow({ entry }: { entry: FontEntry }) {
  const copy = useCopy();
  return (
    <li data-pixaloy="font" className="flex items-start gap-2">
      <button
        type="button"
        data-pixaloy="font-value"
        title="Copy the font-family stack"
        onClick={() => void copy(entry.family, 'Font')}
        className={`${VALUE_CLASS} min-w-0 flex-1 break-all whitespace-normal`}
      >
        {entry.family}
      </button>
      <span data-pixaloy="font-count" className="shrink-0 font-mono text-xs text-muted">
        {entry.count}
      </span>
    </li>
  );
}

function PinnedFont() {
  const pinned = useInspector((state) => state.pinned);
  if (!pinned || !pinned.isConnected) {
    return (
      <p data-pixaloy="pinned-font-hint" className="text-xs text-muted">
        Pin an element to see its font size, weight and line-height.
      </p>
    );
  }
  const metrics = fontMetrics(
    (pinned.ownerDocument.defaultView ?? window).getComputedStyle(pinned),
  );
  const rows: Array<[string, string]> = [
    ['font-size', metrics.size],
    ['font-weight', metrics.weight],
    ['line-height', metrics.lineHeight],
  ];
  return (
    <dl data-pixaloy="pinned-font" className="font-mono text-xs">
      {rows.map(([property, value]) => (
        <div key={property} className="flex gap-2 px-1">
          <dt className="text-accent">{property}</dt>
          <dd data-property={property}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Page tab: the page colours and font stacks with counts. The scan starts on
 * mount and runs in idle chunks; unmounting the tab (or exiting the inspector)
 * cancels it.
 */
export function PageTab() {
  const [state, setState] = useState<ScanState>({ status: 'scanning', progress: null });
  const [run, setRun] = useState(0);

  useEffect(() => {
    const scan = scanPage(document, {
      onProgress: (progress) => setState({ status: 'scanning', progress }),
    });
    scan.done.then(
      (result) => {
        if (result) setState({ status: 'done', result });
      },
      () => setState({ status: 'failed' }),
    );
    return scan.cancel;
  }, [run]);

  const rescan = () => {
    setState({ status: 'scanning', progress: null });
    setRun((value) => value + 1);
  };

  if (state.status !== 'done') {
    return (
      <div data-pixaloy="page-tab" data-status={state.status} className="text-sm text-muted">
        {state.status === 'failed' ? (
          <p>
            The scan failed.{' '}
            <button type="button" className="underline" onClick={rescan}>
              Scan again
            </button>
          </p>
        ) : (
          <p data-pixaloy="page-scan" role="status">
            {state.progress
              ? `Scanning the page… ${state.progress.done} of ${state.progress.total} elements`
              : 'Scanning the page…'}
          </p>
        )}
      </div>
    );
  }

  const { colours, fonts, elements } = state.result;
  return (
    <div data-pixaloy="page-tab" data-status="done" className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span data-pixaloy="page-summary">
          {colours.length} colours · {fonts.length} fonts · {elements} visible elements
        </span>
        <button
          type="button"
          data-pixaloy="rescan"
          onClick={rescan}
          className="ml-auto rounded-sm border border-line px-2 py-px hover:bg-hover"
        >
          Rescan
        </button>
      </div>
      <section aria-label="Colours">
        <h2 className={HEADING_CLASS}>Colours</h2>
        {colours.length === 0 ? (
          <p className="text-xs text-muted">No colours found.</p>
        ) : (
          <ul className="divide-y divide-line">
            {colours.map((entry) => (
              <ColourRow key={entry.key} entry={entry} />
            ))}
          </ul>
        )}
      </section>
      <section aria-label="Fonts">
        <h2 className={HEADING_CLASS}>Fonts</h2>
        {fonts.length === 0 ? (
          <p className="text-xs text-muted">No text found.</p>
        ) : (
          <ul>
            {fonts.map((entry) => (
              <FontRow key={entry.family} entry={entry} />
            ))}
          </ul>
        )}
        <p className="pt-1 text-xs text-muted">
          These are the declared font stacks. The rendered font comes in a later version.
        </p>
      </section>
      <section aria-label="Pinned element font">
        <h2 className={HEADING_CLASS}>Pinned element</h2>
        <PinnedFont />
      </section>
    </div>
  );
}
