/**
 * Re-analyze Button Component
 */
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAtomValue } from 'jotai';
import { graphDataAtom } from '../../../store/atoms';
import { useDeadCodeAnalysis } from '../lib/useDeadCodeAnalysis';

export function AnalyzeButton() {
  const graphData = useAtomValue(graphDataAtom);
  const { isAnalyzing, reanalyze } = useDeadCodeAnalysis();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 flex-1 justify-center text-xs gap-2"
      onClick={reanalyze}
      disabled={isAnalyzing || !graphData}
    >
      {isAnalyzing ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <AlertTriangle size={14} />
          Re-analyze
        </>
      )}
    </Button>
  );
}
