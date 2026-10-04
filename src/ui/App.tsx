import type { BaselineProvider } from '../engine';
import type { InspectorStore } from '../inspector/store';
import { BaselineContext } from './baseline-context';
import { CopyProvider } from './copy/CopyProvider';
import { Overlay } from './Overlay';
import { Panel } from './Panel';
import { InspectorStoreContext } from './store-context';

interface AppProps {
  store: InspectorStore;
  baseline: BaselineProvider;
  onExit: () => void;
}

export function App({ store, baseline, onExit }: AppProps) {
  return (
    <InspectorStoreContext value={store}>
      <BaselineContext value={baseline}>
        <CopyProvider>
          <div className="font-sans text-base text-ink antialiased">
            <Overlay />
            <Panel onExit={onExit} />
          </div>
        </CopyProvider>
      </BaselineContext>
    </InspectorStoreContext>
  );
}
