/**
 * DeadCodeSidebar Header Component
 */

import { useSetAtom } from 'jotai';
import { AlertTriangle, X } from 'lucide-react';
import { activeActivityPageIdAtom } from '@/app/model/activityPageAtoms';
import { viewModeAtom } from '@/entities/AppView/model/atoms';
import { AnalyzeButton } from '@/pages/dead-code/features/DeadCodeAnalysis/ui/AnalyzeButton.tsx';
import { CopyAllButton } from '@/pages/dead-code/features/DeadCodePromptCopy/ui/CopyAllButton.tsx';
import { Button } from '@/shared/ui/Button';

export function DeadCodeSidebarHeader() {
  const setActiveActivityPageId = useSetAtom(activeActivityPageIdAtom);
  const setViewMode = useSetAtom(viewModeAtom);

  function handleCloseDeadCodePage() {
    setActiveActivityPageId('explorer');
    setViewMode('ide');
  }

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-border-DEFAULT">
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={12} className="text-warm-300" />
        <span className="text-2xs font-medium text-text-primary uppercase tracking-wide">Dead Code</span>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center gap-1">
        <AnalyzeButton />
        <CopyAllButton />
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={handleCloseDeadCodePage}>
          <X size={12} />
        </Button>
      </div>
    </div>
  );
}
