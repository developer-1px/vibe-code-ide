/**
 * JsonDetailsPanel - 선택한 행의 상세 정보 표시 (JSON Syntax Highlighting)
 */

import { Copy, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';
import { JsonHighlighter } from './JsonHighlighter';

interface JsonDetailsPanelProps {
  data: Record<string, unknown> | null;
  closePanel: () => void;
}

export function JsonDetailsPanel({ data, closePanel }: JsonDetailsPanelProps) {
  const [copied, setCopied] = useState(false);

  // JSON 문자열 생성 (pretty print)
  const jsonString = useMemo(() => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  }, [data]);

  async function handleCopy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function handleCloseClick() {
    closePanel();
  }

  if (!data) {
    return (
      <div className="w-96 border-l border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep">
          <h2 className="text-xs font-semibold text-text-primary">Details</h2>
          <button
            onClick={handleCloseClick}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Close panel"
          >
            <X size={14} className="text-text-tertiary" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-2xs text-text-tertiary">Select a row to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[480px] border-l border-border-DEFAULT bg-bg-deep flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep shrink-0">
        <h2 className="text-xs font-semibold text-text-primary">Row Details (JSON)</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Copy JSON"
            title="Copy JSON"
          >
            <Copy size={14} className={copied ? 'text-green-400' : 'text-text-tertiary'} />
          </button>
          <button
            onClick={handleCloseClick}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Close panel"
          >
            <X size={14} className="text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* JSON with Syntax Highlighting */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          <JsonHighlighter json={jsonString} />
        </div>
      </ScrollArea>
    </div>
  );
}
