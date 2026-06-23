/**
 * DeadCodeSidebar Summary Component
 */
import { useAtomValue } from 'jotai';
import { deadCodeResultsAtom, selectedDeadCodeItemsAtom } from '@/entities/DeadCode/model/atoms';
import { isAnalyzingAtom } from '@/pages/dead-code/features/DeadCodeAnalysis/model/atoms.ts';

export function DeadCodeSidebarSummary() {
  const isAnalyzing = useAtomValue(isAnalyzingAtom);
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const selectedItems = useAtomValue(selectedDeadCodeItemsAtom);

  return (
    <div className="px-3 py-2 text-xs text-text-muted border-b border-border-DEFAULT">
      {isAnalyzing ? (
        <span>Analyzing project for dead code...</span>
      ) : deadCodeResults ? (
        <div className="space-y-1">
          <div>
            Total issues: <span className="text-warm-300 font-medium">{deadCodeResults.totalCount}</span>
          </div>
          <div className="text-2xs">
            Selected: <span className="text-warm-300">{selectedItems.size}</span> items
          </div>
        </div>
      ) : (
        <span>No analysis results yet</span>
      )}
    </div>
  );
}
