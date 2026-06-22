import { PanelRightClose, PanelRightOpen } from 'lucide-react';

interface DetailsPanelToggleButtonProps {
  rightPanelOpen: boolean;
  changeRightPanelOpen: (nextRightPanelOpen: boolean) => void;
}

export function DetailsPanelToggleButton({ rightPanelOpen, changeRightPanelOpen }: DetailsPanelToggleButtonProps) {
  function handleClick() {
    changeRightPanelOpen(!rightPanelOpen);
  }

  return (
    <button
      onClick={handleClick}
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
  );
}
