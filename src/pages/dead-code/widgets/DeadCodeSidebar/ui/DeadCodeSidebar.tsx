import { Sidebar } from '@/shared/ui/Sidebar';
import { GenerateRefactoringPromptButton } from '../../../features/DeadCodePromptGenerate/ui/GenerateRefactoringPromptButton';
import { DeadCodeExplorer } from '../../../features/DeadCodeSidebar/ui/DeadCodeExplorer.tsx';
import { DeadCodeSidebarHeader } from '../../../features/DeadCodeSidebar/ui/DeadCodeSidebarHeader.tsx';
import { DeadCodeSidebarSummary } from '../../../features/DeadCodeSidebar/ui/DeadCodeSidebarSummary.tsx';

interface DeadCodeSidebarProps {
  canGeneratePrompt: boolean;
  selectedCount: number;
  generatePrompt: () => void;
}

export function DeadCodeSidebar({ canGeneratePrompt, selectedCount, generatePrompt }: DeadCodeSidebarProps) {
  return (
    <Sidebar resizable defaultWidth={280} minWidth={200} maxWidth={600} className="h-full shadow-2xl">
      <Sidebar.Header>
        <DeadCodeSidebarHeader />
      </Sidebar.Header>

      <DeadCodeSidebarSummary />
      <DeadCodeExplorer />

      {canGeneratePrompt && (
        <div className="p-3 border-t border-border-DEFAULT">
          <GenerateRefactoringPromptButton selectedCount={selectedCount} generatePrompt={generatePrompt} />
        </div>
      )}
    </Sidebar>
  );
}
