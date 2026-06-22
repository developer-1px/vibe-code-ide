import { DetailsPanelToggleButton } from './DetailsPanelToggleButton';
import { ExportButton } from './ExportButton';
import { FormatHeadersCheckbox } from './FormatHeadersCheckbox';

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
  return (
    <div className="px-4 py-2.5 border-b border-border-DEFAULT bg-bg-deep shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-text-primary">JSON Explorer</h1>
          <p className="text-2xs text-text-tertiary mt-0.5">Explore test.json data (Server Product Price List)</p>
        </div>

        <div className="flex items-center gap-3">
          <FormatHeadersCheckbox formatHeaders={formatHeaders} changeFormatHeaders={changeFormatHeaders} />

          <ExportButton data={exportData} filename="json-export" />

          <DetailsPanelToggleButton rightPanelOpen={rightPanelOpen} changeRightPanelOpen={changeRightPanelOpen} />
        </div>
      </div>
    </div>
  );
}
