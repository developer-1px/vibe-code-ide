/**
 * Copy All Prompt Button Component
 */
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAtomValue } from 'jotai';
import { deadCodeResultsAtom } from '../../../store/atoms';
import { useCopyAllPrompt } from '../lib/useCopyAllPrompt';

export function CopyAllButton() {
  const deadCodeResults = useAtomValue(deadCodeResultsAtom);
  const { copiedAll, handleCopyAllPrompt } = useCopyAllPrompt();

  return (
    <Button
      variant="default"
      size="sm"
      className="h-8 flex-1 justify-center text-xs gap-2"
      onClick={handleCopyAllPrompt}
      disabled={!deadCodeResults || deadCodeResults.totalCount === 0}
    >
      {copiedAll ? (
        <>
          <Check size={14} className="text-emerald-300" />
          Copied!
        </>
      ) : (
        <>
          <Copy size={14} />
          Copy All Prompt
        </>
      )}
    </Button>
  );
}
