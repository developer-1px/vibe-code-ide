import { useMemo } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';
import { JsonDetailsPanelActions } from '../../../features/JsonDetailsPanel/ui/JsonDetailsPanelActions';
import { JsonHighlighter } from '../../../features/JsonDetailsPanel/ui/JsonHighlighter';

interface JsonDetailsPanelProps {
  data: Record<string, unknown> | null;
  closePanel: () => void;
}

export function JsonDetailsPanel({ data, closePanel }: JsonDetailsPanelProps) {
  const jsonString = useMemo(() => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  }, [data]);

  if (!data) {
    return (
      <div className="w-96 border-l border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep">
          <h2 className="text-xs font-semibold text-text-primary">Details</h2>
          <JsonDetailsPanelActions closePanel={closePanel} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-2xs text-text-tertiary">Select a row to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[480px] border-l border-border-DEFAULT bg-bg-deep flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep shrink-0">
        <h2 className="text-xs font-semibold text-text-primary">Row Details (JSON)</h2>
        <JsonDetailsPanelActions jsonString={jsonString} closePanel={closePanel} />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="py-2">
          <JsonHighlighter json={jsonString} />
        </div>
      </ScrollArea>
    </div>
  );
}
