/**
 * ExportButton - 데이터 내보내기 버튼 (드롭다운)
 */

import { Copy, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard, downloadCsv, downloadJson } from '../lib/exportData';
import { ExportDropdownItem } from './ExportDropdownItem';

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
}

export function ExportButton({ data, filename = 'export' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function exportCsv() {
    downloadCsv(data, `${filename}.csv`);
    setIsOpen(false);
  }

  function exportJson() {
    downloadJson(data, `${filename}.json`);
    setIsOpen(false);
  }

  async function copyData() {
    const success = await copyToClipboard(data);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  }

  function handleToggleOpen() {
    setIsOpen(!isOpen);
  }

  function handleCloseDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 text-2xs font-medium text-text-secondary bg-bg-deep border border-border-DEFAULT rounded-md hover:bg-bg-elevated hover:text-text-primary transition-colors"
      >
        <Download size={12} />
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={handleCloseDropdown} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-bg-elevated border border-border-DEFAULT rounded-md shadow-lg z-20 overflow-hidden">
            <ExportDropdownItem
              icon={<FileSpreadsheet size={14} className="text-green-400" />}
              title="Export as CSV"
              description={`Download ${data.length} rows`}
              runAction={exportCsv}
            />

            <ExportDropdownItem
              icon={<FileJson size={14} className="text-warm-400" />}
              title="Export as JSON"
              description={`Download ${data.length} rows`}
              runAction={exportJson}
            />

            <div className="border-t border-border-DEFAULT" />

            <ExportDropdownItem
              icon={<Copy size={14} className={copied ? 'text-green-400' : 'text-text-tertiary'} />}
              title={copied ? 'Copied!' : 'Copy to Clipboard'}
              description="Copy JSON to clipboard"
              runAction={copyData}
            />
          </div>
        </>
      )}
    </div>
  );
}
