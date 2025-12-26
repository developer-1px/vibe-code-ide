import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { getTokenStyle } from '../../lib/styleUtils.ts';
import { visibleNodeIdsAtom, fullNodeMapAtom, lastExpandedIdAtom } from '../../../../store/atoms';

interface CodeCardTokenProps {
  text: string;
  tokenId: string;
  nodeId: string;
}

const CodeCardToken: React.FC<CodeCardTokenProps> = ({ text, tokenId, nodeId }) => {
  const [visibleNodeIds, setVisibleNodeIds] = useAtom(visibleNodeIdsAtom);
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const setLastExpandedId = useSetAtom(lastExpandedIdAtom);

  const isActive = visibleNodeIds.has(tokenId);

  const handleTokenClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!fullNodeMap.has(tokenId)) return;

    const isCurrentlyVisible = visibleNodeIds.has(tokenId);
    const forceExpand = e.metaKey || e.ctrlKey; // cmd (Mac) or ctrl (Windows/Linux)

    setVisibleNodeIds(prev => {
      const next = new Set(prev);

      if (isCurrentlyVisible && !forceExpand) {
        // TOGGLE OFF (Fold) - only if not force expanding
        next.delete(tokenId);
      } else {
        // TOGGLE ON (Unfold Recursively)
        const expandRecursive = (id: string) => {
          if (next.has(id)) return;
          next.add(id);

          const node = fullNodeMap.get(id);
          if (node) {
            // Stop expanding if we hit a template node
            if (node.type === 'template') return;

            node.dependencies.forEach(depId => {
              if (fullNodeMap.has(depId)) {
                expandRecursive(depId);
              }
            });
          }
        };

        expandRecursive(tokenId);
      }
      return next;
    });

    // Center camera if we are Unfolding (Expanding) OR force expanding
    if (!isCurrentlyVisible || forceExpand) {
      setLastExpandedId(tokenId);
    }
  };

  return (
    <span
      data-token={tokenId}
      className={`
        inline-block px-0.5 rounded cursor-pointer transition-all duration-200 border
        ${getTokenStyle(isActive)}
      `}
      onClick={handleTokenClick}
    >
      {text}
    </span>
  );
};

export default CodeCardToken;
