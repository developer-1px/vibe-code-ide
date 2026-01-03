/**
 * DeadCodePanel - Dead Code Analyzer Panel
 * 사용되지 않는 코드를 정적 분석으로 찾아서 보여줍니다
 */
import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { deadCodeResultsAtom, selectedDeadCodeItemsAtom } from '../../store/atoms';
import { collapsedFoldersAtom } from '../../features/DeadCodeAnalyzer/model/atoms';
import { useDeadCodeAnalysis } from '../../features/DeadCodeAnalyzer/lib/useDeadCodeAnalysis';
import { buildDeadCodeTree } from '../../features/DeadCodeAnalyzer/lib/buildDeadCodeTree';
import { RefactoringPromptDialog } from '../../features/RefactoringPrompt/RefactoringPromptDialog';
import { useTreeKeyboardNavigation } from '../../shared/hooks/useTreeKeyboardNavigation';
import { getDeadCodeFlatList, type DeadCodeFlatItem } from './lib/getDeadCodeFlatList';
import { DeadCodePanelHeader } from './ui/DeadCodePanelHeader';
import { DeadCodePanelSummary } from './ui/DeadCodePanelSummary';
import { DeadCodeList } from './ui/DeadCodeList';

export function DeadCodePanel({ className }: { className?: string }) {
  useDeadCodeAnalysis(); // Auto-analyze on mount
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const selectedItems = useAtomValue(selectedDeadCodeItemsAtom);
  const collapsedFolders = useAtomValue(collapsedFoldersAtom);
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  // Combined flat list for keyboard navigation
  const allCategoryItems = useMemo(() => {
    if (!deadCodeResults) return [];
    return [
      ...deadCodeResults.unusedImports,
      ...deadCodeResults.unusedVariables,
      ...deadCodeResults.deadFunctions,
      ...deadCodeResults.unusedExports,
    ];
  }, [deadCodeResults]);

  const allCategoryTree = useMemo(
    () => buildDeadCodeTree(allCategoryItems),
    [allCategoryItems]
  );

  const flatItemList = useMemo(
    () => getDeadCodeFlatList(allCategoryTree, collapsedFolders, allCategoryItems),
    [allCategoryTree, collapsedFolders, allCategoryItems]
  );

  // Keyboard navigation
  const { itemRefs, containerRef } = useTreeKeyboardNavigation<DeadCodeFlatItem>({
    flatItemList,
    collapsedFolders,
    onToggleFolder: () => {},
    onItemAction: () => {},
  });

  return (
    <div ref={containerRef} tabIndex={0} className={cn('flex h-full flex-col bg-bg-surface border-r border-border-DEFAULT focus:outline-none', className)}>
      <DeadCodePanelHeader />
      <DeadCodePanelSummary />
      <DeadCodeList itemRefs={itemRefs} />

      {/* Generate Prompt Button */}
      {deadCodeResults && selectedItems.size > 0 && (
        <div className="p-3 border-t border-border-DEFAULT">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-center gap-2"
            onClick={() => setShowPromptDialog(true)}
          >
            <Sparkles size={14} />
            Generate AI Refactoring Prompt ({selectedItems.size})
          </Button>
        </div>
      )}

      {/* Refactoring Prompt Dialog */}
      {deadCodeResults && (
        <RefactoringPromptDialog
          open={showPromptDialog}
          onOpenChange={setShowPromptDialog}
          selectedItemKeys={selectedItems}
          deadCodeResults={deadCodeResults}
        />
      )}
    </div>
  );
}

export default DeadCodePanel;
