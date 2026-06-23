import { Provider, useAtomValue, useSetAtom } from 'jotai';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { HotkeysProvider } from 'react-hotkeys-hook';
import * as ts from 'typescript';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { activityPageById } from '@/app/model/activityPages';
import { AppActivityBar } from '@/app/ui/AppActivityBar/AppActivityBar';
import { AppStatusBar } from '@/app/ui/AppStatusBar/AppStatusBar';
import { AppTitleBar } from '@/app/ui/AppTitleBar/AppTitleBar';
import { ThemeProvider } from '@/entities/AppTheme/ThemeProvider';
import { filesAtom, graphDataAtom, parseErrorAtom, parseProgressAtom } from '@/entities/AppView/model/atoms';
import { store } from '@/entities/AppView/model/store';
import { UnifiedSearchModal } from '@/features/Search/UnifiedSearch/ui/UnifiedSearchModal';
import { KeyboardShortcuts } from './app/effects/KeyboardShortcuts';
import type { SourceFileNode } from './entities/SourceFileNode/model/types';

const AppContent: React.FC = () => {
  // Parse project when files change
  const files = useAtomValue(filesAtom);
  const setGraphData = useSetAtom(graphDataAtom);
  const setParseError = useSetAtom(parseErrorAtom);
  const setParseProgress = useSetAtom(parseProgressAtom);
  const activeActivityPageId = useAtomValue(activeActivityPageIdAtom);
  const workerRef = useRef<Worker | null>(null);
  const activeActivityPage = activityPageById.get(activeActivityPageId) ?? activityPageById.get('explorer');
  const ActiveActivityPage = activeActivityPage?.Component;

  // 🔥 Web Worker for Project Parsing
  useEffect(() => {
    console.log('[App] Files changed, starting Worker-based parsing');

    // Create Worker
    const worker = new Worker(new URL('./workers/parseProject.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    // Set loading state
    setParseProgress({
      isLoading: true,
      current: 0,
      total: Object.keys(files).length,
      currentFile: null,
    });

    // Handle Worker messages
    worker.onmessage = (event) => {
      const { type } = event.data;

      if (type === 'progress') {
        // Update progress
        const { current, total, currentFile } = event.data;
        setParseProgress({
          isLoading: true,
          current,
          total,
          currentFile,
        });
      } else if (type === 'result') {
        // Parse complete
        const { nodes, parseTime } = event.data;
        console.log(`[App] Worker parsing complete: ${nodes.length} nodes in ${parseTime.toFixed(2)}ms`);

        // Reconstruct SourceFileNode[] with ts.SourceFile
        const reconstructedNodes: SourceFileNode[] = nodes.map((serializedNode: unknown) => {
          const node = serializedNode as Partial<SourceFileNode>;
          // Symbol 노드는 sourceFile 재구성 불필요 (type/interface/function/const 등)
          if (node.type !== 'file') {
            return node as SourceFileNode;
          }

          // 파일 노드만 sourceFile 재구성
          const scriptKind = node.filePath?.endsWith('.tsx')
            ? ts.ScriptKind.TSX
            : node.filePath?.endsWith('.jsx')
              ? ts.ScriptKind.JSX
              : ts.ScriptKind.TS;

          const sourceFile = ts.createSourceFile(
            node.filePath || '',
            node.codeSnippet || '',
            ts.ScriptTarget.Latest,
            true,
            scriptKind
          );

          return {
            ...node,
            sourceFile,
          } as SourceFileNode;
        });

        setGraphData({ nodes: reconstructedNodes });
        setParseError(null);
        setParseProgress({
          isLoading: false,
          current: nodes.length,
          total: nodes.length,
          currentFile: null,
        });

        // Terminate worker
        worker.terminate();
      }
    };

    worker.onerror = (error) => {
      console.error('[App] Worker error:', error);
      setParseError('Worker parsing failed');
      setParseProgress({
        isLoading: false,
        current: 0,
        total: 0,
        currentFile: null,
      });
      worker.terminate();
    };

    // Send parsing request
    worker.postMessage({ type: 'parseProject', files });

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [files, setGraphData, setParseError, setParseProgress]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-deep text-text-primary select-none">
      {/* Workspace persistence (save/restore state) */}
      {/*<WorkspacePersistence />*/}

      {/* 키보드 단축키 관리 */}
      <KeyboardShortcuts />

      {/* Title Bar */}
      <AppTitleBar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Activity Bar */}
        <AppActivityBar />

        {ActiveActivityPage && <ActiveActivityPage />}
      </div>

      {/* Status Bar */}
      <AppStatusBar />

      {/* Jotai DevTools */}
      {/*<JotaiDevTools />*/}

      {/* Unified Search Modal (Shift+Shift) */}
      <UnifiedSearchModal />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider initialTheme="default">
        <HotkeysProvider>
          <AppContent />
        </HotkeysProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
