/**
 * Copy All Prompt Hook
 */

import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { getDeadCodeItemKey } from '@/entities/DeadCode/lib/computed';
import { deadCodeResultsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';

export function useCopyAllPrompt() {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleCopyAllPrompt() {
    if (!deadCodeResults) return;

    // Generate prompt from all items
    const { generateRefactoringPrompt } = await import(
      '@/pages/dead-code/features/RefactoringPrompt/lib/promptGenerator.ts'
    );

    // Select all items
    const allItems = [
      ...deadCodeResults.unusedExports,
      ...deadCodeResults.unusedImports,
      ...deadCodeResults.deadFunctions,
      ...deadCodeResults.unusedVariables,
    ];
    const allKeys = new Set(allItems.map(getDeadCodeItemKey));

    const prompt = generateRefactoringPrompt(allKeys, deadCodeResults);

    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  return {
    copiedAll,
    handleCopyAllPrompt,
  };
}
