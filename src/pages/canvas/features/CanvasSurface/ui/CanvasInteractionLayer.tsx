import { useAtom, useAtomValue } from 'jotai';
import type React from 'react';
import type { ReactNode, RefObject } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { filesAtom, focusedPaneAtom, fullNodeMapAtom } from '@/entities/AppView/model/atoms';
import { openedFilesAtom, selectedNodeIdsAtom, visibleNodeIdsAtom } from '@/features/Canvas/model/atoms';

interface CanvasInteractionLayerProps {
  containerRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function CanvasInteractionLayer({ containerRef, children }: CanvasInteractionLayerProps) {
  const [_visibleNodeIds, setVisibleNodeIds] = useAtom(visibleNodeIdsAtom);
  const [_openedFiles, setOpenedFiles] = useAtom(openedFilesAtom);
  const [selectedNodeIds, setSelectedNodeIds] = useAtom(selectedNodeIdsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const files = useAtomValue(filesAtom);
  const [focusedPane, setFocusedPane] = useAtom(focusedPaneAtom);

  function handleCanvasClick(e: React.MouseEvent) {
    setFocusedPane('canvas');

    if (e.target === e.currentTarget) {
      setSelectedNodeIds(new Set());
    }
  }

  function handleDeleteSelectedNodes(e: KeyboardEvent) {
    console.log(
      '[PipelineCanvas] Delete/Backspace pressed, focusedPane:',
      focusedPane,
      'selectedNodeIds:',
      selectedNodeIds.size
    );

    if (focusedPane !== 'canvas' || selectedNodeIds.size === 0) {
      console.log('[PipelineCanvas] Ignoring: focusedPane:', focusedPane, 'selectedCount:', selectedNodeIds.size);
      return;
    }

    e.preventDefault();

    const filesToClose = new Set<string>();
    const nodeIdsToRemove = new Set<string>();

    selectedNodeIds.forEach((nodeId) => {
      nodeIdsToRemove.add(nodeId);

      if (files[nodeId]) {
        filesToClose.add(nodeId);
        return;
      }

      const node = fullNodeMap.get(nodeId);
      if (node) {
        filesToClose.add(node.filePath);

        fullNodeMap.forEach((mapNode) => {
          if (mapNode.filePath === node.filePath) {
            nodeIdsToRemove.add(mapNode.id);
          }
        });
      }
    });

    console.log('[PipelineCanvas] OpenFiles to close:', Array.from(filesToClose));
    console.log('[PipelineCanvas] Node IDs to remove:', Array.from(nodeIdsToRemove));

    if (filesToClose.size > 0) {
      setOpenedFiles((prev) => {
        const next = new Set(prev);
        filesToClose.forEach((filePath) => {
          next.delete(filePath);
        });
        return next;
      });

      setVisibleNodeIds((prev) => {
        const next = new Set(prev);
        nodeIdsToRemove.forEach((nodeId) => {
          next.delete(nodeId);
        });
        return next;
      });

      setSelectedNodeIds(new Set());
    }
  }

  useHotkeys('delete, backspace', handleDeleteSelectedNodes, {
    enableOnFormTags: false,
    enabled: true,
  });

  return (
    <div
      className="h-full min-h-0 w-full min-w-0 relative overflow-hidden bg-vibe-dark"
      ref={containerRef}
      onClick={handleCanvasClick}
    >
      {children}
    </div>
  );
}
