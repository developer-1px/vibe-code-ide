import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { deadCodeResultsAtom, selectedDeadCodeItemsAtom } from '@/entities/DeadCode/model/atoms';
import { useDeadCodeAnalysis } from './features/DeadCodeAnalysis/lib/useDeadCodeAnalysis.ts';
import { RefactoringPromptDialog } from './features/RefactoringPrompt/RefactoringPromptDialog.tsx';
import { DeadCodeFileReview } from './widgets/DeadCodeFileReview/ui/DeadCodeFileReview.tsx';
import { DeadCodeSidebar } from './widgets/DeadCodeSidebar/ui/DeadCodeSidebar.tsx';

export function PageDeadCode() {
  useDeadCodeAnalysis();

  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const selectedItems = useAtomValue(selectedDeadCodeItemsAtom);
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  function handleGeneratePromptClick() {
    setShowPromptDialog(true);
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <div className="relative focus:outline-none">
        <DeadCodeSidebar
          canGeneratePrompt={Boolean(deadCodeResults && selectedItems.size > 0)}
          selectedCount={selectedItems.size}
          generatePrompt={handleGeneratePromptClick}
        />
      </div>

      <DeadCodeFileReview />

      {deadCodeResults && (
        <RefactoringPromptDialog
          open={showPromptDialog}
          changeOpen={setShowPromptDialog}
          selectedItemKeys={selectedItems}
          deadCodeResults={deadCodeResults}
        />
      )}
    </div>
  );
}
