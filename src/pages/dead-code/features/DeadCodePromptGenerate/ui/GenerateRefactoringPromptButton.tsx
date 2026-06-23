import { Sparkles } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface GenerateRefactoringPromptButtonProps {
  selectedCount: number;
  generatePrompt: () => void;
}

export function GenerateRefactoringPromptButton({
  selectedCount,
  generatePrompt,
}: GenerateRefactoringPromptButtonProps) {
  function handleGeneratePromptClick() {
    generatePrompt();
  }

  return (
    <Button variant="default" size="sm" className="w-full justify-center gap-2" onClick={handleGeneratePromptClick}>
      <Sparkles size={14} />
      Generate AI Refactoring Prompt ({selectedCount})
    </Button>
  );
}
