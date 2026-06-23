import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef } from 'react';
import { filesAtom, fullNodeMapAtom, graphDataAtom } from '@/entities/AppView/model/atoms';
import { openedFilesAtom, visibleNodeIdsAtom } from '@/features/Canvas/model/atoms';
import { symbolMetadataAtom } from '@/features/Search/UnifiedSearch/model/atoms.ts';
import { extractSymbolMetadata } from '@/shared/symbolMetadataExtractor.ts';
import { CanvasControls } from '../../../features/CanvasControls/ui/CanvasControls.tsx';
import { useCanvasLayout } from '../../../features/CanvasStage/hooks/useCanvasLayout.ts';
import { CanvasStage } from '../../../features/CanvasStage/ui/CanvasStage.tsx';
import { CanvasInteractionLayer } from '../../../features/CanvasSurface/ui/CanvasInteractionLayer.tsx';

export function CanvasBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleNodeIds, _setVisibleNodeIds] = useAtom(visibleNodeIdsAtom);
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

    const filePaths = new Set<string>();
    visibleNodeIds.forEach((nodeId) => {
      const node = fullNodeMap.get(nodeId);
      if (node) {
        filePaths.add(node.filePath);
      }
    });

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
    if (openedFiles.size === 0) return visibleNodeIds;

    const expanded = new Set(visibleNodeIds);

    openedFiles.forEach((filePath) => {
      expanded.add(filePath);
    });

    return expanded;
  }, [openedFiles, visibleNodeIds]);

  const { layoutNodes } = useCanvasLayout(graphData, expandedVisibleNodeIds);

  return (
    <CanvasInteractionLayer containerRef={containerRef}>
      <CanvasControls />
      <CanvasStage containerRef={containerRef} layoutNodes={layoutNodes} />
    </CanvasInteractionLayer>
  );
}
