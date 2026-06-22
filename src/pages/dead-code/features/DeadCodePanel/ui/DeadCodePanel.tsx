/**
 * DeadCodePanel - Dead Code Analyzer Panel Container
 * Provides panel layout for dead code exploration
 */

import { useAtomValue } from 'jotai';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useDeadCodeAnalysis } from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/lib/useDeadCodeAnalysis.ts';
import {
  deadCodeResultsAtom,
  selectedDeadCodeItemsAtom,
} from '@/features/Code/CodeAnalyzer/DeadCodeAnalyzer/model/atoms.ts';
import IDEScrollView from '@/features/File/OpenFiles/ui/IDEScrollView/IDEScrollView.tsx';
import { RefactoringPromptDialog } from '@/features/RefactoringPrompt/RefactoringPromptDialog.tsx';
import { Button } from '@/shared/ui/Button';
import { Sidebar } from '@/shared/ui/Sidebar';
import { DeadCodeExplorer } from './DeadCodeExplorer.tsx';
import { DeadCodePanelHeader } from './DeadCodePanelHeader.tsx';
import { DeadCodePanelSummary } from './DeadCodePanelSummary.tsx';

export function DeadCodePanel() {
  useDeadCodeAnalysis(); // Auto-analyze on mount
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const selectedItems = useAtomValue(selectedDeadCodeItemsAtom);
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  function handleGeneratePromptClick() {
    setShowPromptDialog(true);
  }

  function handlePromptOpenChange(nextOpen: boolean) {
    setShowPromptDialog(nextOpen);
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* 좌측: Dead Code Panel */}
      <div className="relative focus:outline-none">
        <Sidebar resizable defaultWidth={280} minWidth={200} maxWidth={600} className="h-full shadow-2xl">
          <Sidebar.Header>
            <DeadCodePanelHeader />
          </Sidebar.Header>

          <DeadCodePanelSummary />
          <DeadCodeExplorer />

          {/* Generate Prompt Button */}
          {deadCodeResults && selectedItems.size > 0 && (
            <div className="p-3 border-t border-border-DEFAULT">
              <Button
                variant="default"
                size="sm"
                className="w-full justify-center gap-2"
                onClick={handleGeneratePromptClick}
              >
                <Sparkles size={14} />
                Generate AI Refactoring Prompt ({selectedItems.size})
              </Button>
            </div>
          )}
        </Sidebar>

        {/* Refactoring Prompt Dialog */}
        {deadCodeResults && (
          <RefactoringPromptDialog
            open={showPromptDialog}
            onOpenChange={handlePromptOpenChange}
            selectedItemKeys={selectedItems}
            deadCodeResults={deadCodeResults}
          />
        )}
      </div>

      {/* 우측: IDEScrollView */}
      <IDEScrollView />
    </div>
  );
}

export default DeadCodePanel;
