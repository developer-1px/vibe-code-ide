import { useAtomValue } from 'jotai';
import { useState } from 'react';
import IDEScrollView from '@/features/File/OpenFiles/ui/IDEScrollView';
import { deadCodeResultsAtom, selectedDeadCodeItemsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';
import { useDeadCodeAnalysis } from './features/DeadCodeAnalysis/lib/useDeadCodeAnalysis.ts';
import { RefactoringPromptDialog } from './features/RefactoringPrompt/RefactoringPromptDialog.tsx';
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

      <IDEScrollView />

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
