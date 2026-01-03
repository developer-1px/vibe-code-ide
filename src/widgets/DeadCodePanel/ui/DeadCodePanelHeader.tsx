/**
 * DeadCodePanel Header Component
 */
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSetAtom } from 'jotai';
import { deadCodePanelOpenAtom } from '../../../store/atoms';
import { AnalyzeButton } from '../../../features/DeadCodeAnalyzer/ui/AnalyzeButton';
import { CopyAllButton } from '../../../features/DeadCodePromptCopy/ui/CopyAllButton';

export function DeadCodePanelHeader() {
  const setDeadCodePanelOpen = useSetAtom(deadCodePanelOpenAtom);

  return (
    <div className="p-3 space-y-2 border-b border-border-DEFAULT">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-warm-300" />
          <span className="text-xs font-medium text-text-primary uppercase tracking-wide">
            Dead Code Analyzer
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setDeadCodePanelOpen(false)}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <AnalyzeButton />
        <CopyAllButton />
      </div>
    </div>
  );
}
