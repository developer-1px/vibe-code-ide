/**
 * Inline Fold Badge Component
 * Shows {...} when code block is folded
 */

import React from 'react';
import { useSetAtom } from 'jotai';
import { foldedLinesAtom } from '../../../store/atoms';

interface FoldBadgeProps {
  nodeId: string;
  lineNum: number;
  isFolded: boolean;
  foldedCount?: number;
}

const FoldBadge: React.FC<FoldBadgeProps> = ({ nodeId, lineNum, isFolded, foldedCount }) => {
  const setFoldedLinesMap = useSetAtom(foldedLinesAtom);

  if (!isFolded || foldedCount === undefined) {
    return null;
  }

  const handleUnfold = (e: React.MouseEvent) => {
    e.stopPropagation();

    setFoldedLinesMap((prev) => {
      const next = new Map(prev);
      const nodeFolds = new Set(next.get(nodeId) || new Set());
      nodeFolds.delete(lineNum);
      next.set(nodeId, nodeFolds);
      return next;
    });
  };

  return (
    <span
      onClick={handleUnfold}
      className="ml-1 px-1 py-1 rounded bg-slate-700/40 text-slate-400 text-[10px] select-none border border-slate-600/30 cursor-pointer hover:bg-slate-600/60 hover:text-slate-300 hover:border-slate-500/50 transition-colors"
      title="Click to unfold"
    >
      {'{...}'}
    </span>
  );
};

export default FoldBadge;
