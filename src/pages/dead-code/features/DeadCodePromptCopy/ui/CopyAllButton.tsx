/**
 * Copy All Prompt Button Component
 */

import { useAtomValue } from 'jotai';
import { Check, Copy } from 'lucide-react';
import { deadCodeResultsAtom } from '@/pages/shared/features/DeadCode/model/atoms.ts';
import { Button } from '@/shared/ui/Button';
import { useCopyAllPrompt } from '../lib/useCopyAllPrompt.ts';

export function CopyAllButton() {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const { copiedAll, handleCopyAllPrompt } = useCopyAllPrompt();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-5 w-5 p-0"
      onClick={handleCopyAllPrompt}
      disabled={!deadCodeResults || deadCodeResults.totalCount === 0}
      title={copiedAll ? 'Copied!' : 'Copy All Prompt'}
    >
      {copiedAll ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
    </Button>
  );
}
