import { Copy, X } from 'lucide-react';
import { useState } from 'react';

interface JsonDetailsPanelActionsProps {
  jsonString?: string;
  closePanel: () => void;
}

export function JsonDetailsPanelActions({ jsonString, closePanel }: JsonDetailsPanelActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!jsonString) return;

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

  return (
    <div className="flex items-center gap-1">
      {jsonString && (
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 hover:bg-bg-elevated rounded transition-colors"
          aria-label="Copy JSON"
          title="Copy JSON"
        >
          <Copy size={14} className={copied ? 'text-green-400' : 'text-text-tertiary'} />
        </button>
      )}
      <button
        type="button"
        onClick={handleCloseClick}
        className="p-1 hover:bg-bg-elevated rounded transition-colors"
        aria-label="Close panel"
      >
        <X size={14} className="text-text-tertiary" />
      </button>
    </div>
  );
}
