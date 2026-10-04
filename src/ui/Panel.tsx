import type { PanelTab } from '../inspector/store';
import { CopyFallback, CopyToast } from './copy/CopyProvider';
import { useInspector } from './store-context';
import { ElementTab } from './tabs/ElementTab';
import { PageTab } from './tabs/PageTab';

const TABS: ReadonlyArray<{ id: PanelTab; label: string }> = [
  { id: 'element', label: 'Element' },
  { id: 'page', label: 'Page' },
];

interface PanelProps {
  onExit: () => void;
}

/** The docked panel: a tab bar, the active tab, and the copy feedback. */
export function Panel({ onExit }: PanelProps) {
  const tab = useInspector((state) => state.tab);
  const setTab = useInspector((state) => state.setTab);

  return (
    <section
      data-pixaloy="panel"
      aria-label="Pixaloy inspector"
      className="pointer-events-auto fixed right-3 bottom-3 flex max-h-[calc(100vh-24px)] w-[340px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-panel"
    >
      <header className="flex items-center gap-1 border-b border-line px-2 py-1">
        <span className="mr-2 text-sm font-semibold">Pixaloy</span>
        <div role="tablist" className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-sm px-2 py-1 text-sm ${
                tab === id ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-hover'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-pixaloy="close"
          aria-label="Close Pixaloy"
          title="Close (Esc)"
          onClick={onExit}
          className="ml-auto rounded-sm px-2 py-1 text-sm text-muted hover:bg-hover"
        >
          ✕
        </button>
      </header>
      <CopyFallback />
      <div role="tabpanel" className="max-h-[480px] min-h-0 flex-1 overflow-auto p-3">
        {tab === 'element' ? <ElementTab /> : <PageTab />}
      </div>
      <CopyToast />
    </section>
  );
}
