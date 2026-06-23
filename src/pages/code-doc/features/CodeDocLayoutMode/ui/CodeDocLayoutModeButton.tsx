import { Columns3, FileText } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { CodeDocLayoutMode } from '../../CodeDocReader/model/types';

interface CodeDocLayoutModeButtonProps {
  layoutMode: CodeDocLayoutMode;
  changeLayoutMode: Dispatch<SetStateAction<CodeDocLayoutMode>>;
}

export function CodeDocLayoutModeButton({ layoutMode, changeLayoutMode }: CodeDocLayoutModeButtonProps) {
  function handleLayoutModeClick() {
    changeLayoutMode((prev) => (prev === 'linear' ? 'split' : 'linear'));
  }

  return (
    <button
      type="button"
      onClick={handleLayoutModeClick}
      className="p-2 rounded-lg bg-bg-deep border border-border shadow-sm text-text-secondary hover:text-text-primary transition-colors"
      title={layoutMode === 'linear' ? 'Annotated Layout' : 'Standard Layout'}
    >
      {layoutMode === 'linear' ? <Columns3 size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
    </button>
  );
}
