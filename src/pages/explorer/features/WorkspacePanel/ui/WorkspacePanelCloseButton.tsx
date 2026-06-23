import { useSetAtom } from 'jotai';
import { X } from 'lucide-react';
import { rightPanelOpenAtom } from '@/entities/AppView/model/atoms';

export function WorkspacePanelCloseButton() {
  const setRightPanelOpen = useSetAtom(rightPanelOpenAtom);

  function handleCloseClick() {
    setRightPanelOpen(false);
  }

  return (
    <button
      type="button"
      onClick={handleCloseClick}
      className="rounded p-1 text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors"
      title="Close Workspace Panel"
    >
      <X size={14} />
    </button>
  );
}
