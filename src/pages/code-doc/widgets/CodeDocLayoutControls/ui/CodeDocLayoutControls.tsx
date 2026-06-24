import type { Dispatch, SetStateAction } from 'react';
import { CodeDocLayoutModeButton } from '../../../features/CodeDocLayoutMode/ui/CodeDocLayoutModeButton';
import type { CodeDocLayoutMode } from '../../../features/CodeDocReader/model/types';

interface CodeDocLayoutControlsProps {
  layoutMode: CodeDocLayoutMode;
  changeLayoutMode: Dispatch<SetStateAction<CodeDocLayoutMode>>;
}

export function CodeDocLayoutControls({ layoutMode, changeLayoutMode }: CodeDocLayoutControlsProps) {
  return (
    <div className="absolute top-6 right-8 z-50 print:hidden">
      <CodeDocLayoutModeButton layoutMode={layoutMode} changeLayoutMode={changeLayoutMode} />
    </div>
  );
}
