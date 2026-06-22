import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Checkbox } from '@/shared/ui/Checkbox';
import { ExportButton } from './ExportButton';

interface JsonExplorerHeaderProps {
  formatHeaders: boolean;
  changeFormatHeaders: (nextFormatHeaders: boolean) => void;
  exportData: Record<string, unknown>[];
  rightPanelOpen: boolean;
  changeRightPanelOpen: (nextRightPanelOpen: boolean) => void;
}

export function JsonExplorerHeader({
  formatHeaders,
  changeFormatHeaders,
  exportData,
  rightPanelOpen,
  changeRightPanelOpen,
}: JsonExplorerHeaderProps) {
  function handleFormatHeadersCheckedChange(checked: boolean | 'indeterminate') {
    changeFormatHeaders(checked === true);
  }

  function handleRightPanelToggle() {
    changeRightPanelOpen(!rightPanelOpen);
  }

  return (
    <div className="px-4 py-2.5 border-b border-border-DEFAULT bg-bg-deep shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary">JSON Explorer</h1>
          <p className="text-2xs text-text-tertiary mt-0.5">Explore test.json data (Server Product Price List)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox id="format-headers" checked={formatHeaders} onCheckedChange={handleFormatHeadersCheckedChange} />
            <label
              htmlFor="format-headers"
              className="text-2xs text-text-secondary cursor-pointer select-none hover:text-text-primary transition-colors"
            >
              Format Headers
            </label>
          </div>

          <ExportButton data={exportData} filename="json-export" />

          <button
            onClick={handleRightPanelToggle}
            className="p-1.5 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Toggle details panel"
            title={rightPanelOpen ? 'Close details panel' : 'Open details panel'}
          >
            {rightPanelOpen ? (
              <PanelRightClose size={16} className="text-warm-400" />
            ) : (
              <PanelRightOpen size={16} className="text-text-tertiary" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
