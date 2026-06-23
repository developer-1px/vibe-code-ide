import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { filesAtom, fullNodeMapAtom, graphDataAtom } from '@/entities/AppView/model/atoms';
import { getExpandedVisibleNodeIds, getFilePathsForVisibleNodes } from '@/entities/AppView/model/computed';
import { openedFilesAtom, visibleNodeIdsAtom } from '@/features/Canvas/model/atoms';
import { symbolMetadataAtom } from '@/features/Search/UnifiedSearch/model/atoms.ts';
import { extractSymbolMetadata } from '@/shared/symbolMetadataExtractor.ts';
import { CanvasControls } from './features/CanvasControls/ui/CanvasControls.tsx';
import { useCanvasLayout } from './features/CanvasStage/hooks/useCanvasLayout.ts';
import { CanvasStage } from './features/CanvasStage/ui/CanvasStage.tsx';
import { CanvasInteractionLayer } from './features/CanvasSurface/ui/CanvasInteractionLayer.tsx';

export function PageCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleNodeIds] = useAtom(visibleNodeIdsAtom);
  const [openedFiles, setOpenedFiles] = useAtom(openedFilesAtom);
  const graphData = useAtomValue(graphDataAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const files = useAtomValue(filesAtom);
  const setSymbolMetadata = useSetAtom(symbolMetadataAtom);

  useEffect(() => {
    if (fullNodeMap.size > 0 && files && Object.keys(files).length > 0) {
      const metadata = extractSymbolMetadata(fullNodeMap, files);
      setSymbolMetadata(metadata);
    }
  }, [fullNodeMap, files, setSymbolMetadata]);

  useEffect(() => {
    if (!fullNodeMap || fullNodeMap.size === 0) return;

    const filePaths = getFilePathsForVisibleNodes(visibleNodeIds, fullNodeMap);
    let needsUpdate = false;
    filePaths.forEach((filePath) => {
      if (!openedFiles.has(filePath)) {
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setOpenedFiles((prev) => new Set([...prev, ...filePaths]));
    }
  }, [visibleNodeIds, fullNodeMap, openedFiles, setOpenedFiles]);

  const expandedVisibleNodeIds = useMemo(() => {
    return getExpandedVisibleNodeIds(visibleNodeIds, openedFiles);
  }, [openedFiles, visibleNodeIds]);

  const { layoutNodes } = useCanvasLayout(graphData, expandedVisibleNodeIds);

  return (
    <div className="h-full min-h-0 w-full min-w-0 relative overflow-hidden">
      <CanvasInteractionLayer containerRef={containerRef}>
        <CanvasControls />
        <CanvasStage containerRef={containerRef} layoutNodes={layoutNodes} />
      </CanvasInteractionLayer>
    </div>
  );
}
