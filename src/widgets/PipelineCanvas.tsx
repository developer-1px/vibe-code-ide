import React, { useRef, useMemo, useEffect } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';

// Hooks & Sub-components
import { useCanvasLayout } from './PipelineCanvas/useCanvasLayout.ts';
import D3ZoomContainer from './PipelineCanvas/D3ZoomContainer.tsx';
import CanvasConnections from './PipelineCanvas/CanvasConnections.tsx';
import CanvasBackground from './PipelineCanvas/CanvasBackground.tsx';
import { CanvasCodeCard } from './PipelineCanvas/CanvasCodeCard.tsx';
import CopyAllCodeButton from '../features/CopyAllCodeButton.tsx';
import ResetViewButton from '../features/ResetViewButton.tsx';

// Atoms & Hooks
import { visibleNodeIdsAtom, entryFileAtom, selectedNodeIdsAtom, openedFilesAtom, fullNodeMapAtom, symbolMetadataAtom, filesAtom } from '../store/atoms';
import { useGraphData } from '../hooks/useGraphData';
import { extractSymbolMetadata } from '../services/symbolMetadataExtractor';

const PipelineCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Read atoms
  const visibleNodeIds = useAtomValue(visibleNodeIdsAtom);
  const entryFile = useAtomValue(entryFileAtom);
  const [openedFiles, setOpenedFiles] = useAtom(openedFilesAtom);
  const { data: graphData } = useGraphData();
  const setSelectedNodeIds = useSetAtom(selectedNodeIdsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const files = useAtomValue(filesAtom);
  const setSymbolMetadata = useSetAtom(symbolMetadataAtom);

  // Extract symbol metadata after parsing completes
  useEffect(() => {
    if (fullNodeMap.size > 0 && files && Object.keys(files).length > 0) {
      const metadata = extractSymbolMetadata(fullNodeMap, files);
      setSymbolMetadata(metadata);
    }
  }, [fullNodeMap, files, setSymbolMetadata]);

  // Sync openedFiles with visibleNodeIds - auto-add files when nodes are opened
  useEffect(() => {
    if (!fullNodeMap || fullNodeMap.size === 0) return;

    const filePaths = new Set<string>();
    visibleNodeIds.forEach(nodeId => {
      const node = fullNodeMap.get(nodeId);
      if (node) {
        filePaths.add(node.filePath);
      }
    });

    // Add missing files to openedFiles
    let needsUpdate = false;
    filePaths.forEach(filePath => {
      if (!openedFiles.has(filePath)) {
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setOpenedFiles(prev => new Set([...prev, ...filePaths]));
    }
  }, [visibleNodeIds, fullNodeMap, openedFiles, setOpenedFiles]);

  // Expand visibleNodeIds to include file nodes from opened files
  // (but not individual function/variable nodes)
  const expandedVisibleNodeIds = useMemo(() => {
    if (!graphData || openedFiles.size === 0) return visibleNodeIds;

    const expanded = new Set(visibleNodeIds);

    // Add only file-type nodes from opened files
    graphData.nodes.forEach(node => {
      if (openedFiles.has(node.filePath) && node.type === 'file') {
        expanded.add(node.id);
      }
    });

    return expanded;
  }, [graphData, openedFiles, visibleNodeIds]);

  // 1. Layout Logic (simple display of visible nodes)
  const { layoutNodes } = useCanvasLayout(graphData, entryFile, expandedVisibleNodeIds);

  // Clear selection when clicking on canvas background
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only clear if clicking directly on canvas, not on children (cards)
    if (e.target === e.currentTarget) {
      setSelectedNodeIds(new Set());
    }
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-vibe-dark select-none"
      ref={containerRef}
      onClick={handleCanvasClick}
    >

      {/* Controls */}
      <ResetViewButton />

      {/* Copy All Code Button - Bottom Right */}
      <CopyAllCodeButton />

      <D3ZoomContainer containerRef={containerRef}>
        {/* Background Groups */}
        {/*<CanvasBackground />*/}

        {/* Connections */}
        <CanvasConnections />

        {/* Nodes */}
        {layoutNodes.map(node => (
          <CanvasCodeCard key={node.visualId} node={node} />
        ))}
      </D3ZoomContainer>
    </div>
  );
};

export default PipelineCanvas;