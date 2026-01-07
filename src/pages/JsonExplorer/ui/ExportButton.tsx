/**
 * ExportButton - 데이터 내보내기 버튼 (드롭다운)
 */

import { Download, FileJson, FileSpreadsheet, Copy } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard, downloadCsv, downloadJson } from '../lib/exportData';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
}

export function ExportButton({ data, filename = 'export' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportCsv = () => {
    downloadCsv(data, `${filename}.csv`);
    setIsOpen(false);
  };

  const handleExportJson = () => {
    downloadJson(data, `${filename}.json`);
    setIsOpen(false);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(data);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-2xs font-medium text-text-secondary bg-bg-deep border border-border-DEFAULT rounded-md hover:bg-bg-elevated hover:text-text-primary transition-colors"
      >
        <Download size={12} />
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated border border-border-DEFAULT rounded-md shadow-lg z-20 overflow-hidden">
            <button
              onClick={handleExportCsv}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-text-secondary hover:bg-warm-500/10 hover:text-text-primary transition-colors"
            >
              <FileSpreadsheet size={14} className="text-green-400" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Export as CSV</span>
                <span className="text-3xs text-text-tertiary">Download {data.length} rows</span>
              </div>
            </button>

            <button
              onClick={handleExportJson}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-text-secondary hover:bg-warm-500/10 hover:text-text-primary transition-colors"
            >
              <FileJson size={14} className="text-warm-400" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Export as JSON</span>
                <span className="text-3xs text-text-tertiary">Download {data.length} rows</span>
              </div>
            </button>

            <div className="border-t border-border-DEFAULT" />

            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-text-secondary hover:bg-warm-500/10 hover:text-text-primary transition-colors"
            >
              <Copy size={14} className={copied ? 'text-green-400' : 'text-text-tertiary'} />
              <div className="flex flex-col items-start">
                <span className="font-medium">{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
                <span className="text-3xs text-text-tertiary">Copy JSON to clipboard</span>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
