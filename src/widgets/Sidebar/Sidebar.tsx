import React, { useState, useRef } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useDrag } from '@use-gesture/react';
import { FolderTree } from 'lucide-react';
import { filesAtom, isSidebarOpenAtom, viewModeAtom } from '../../store/atoms';
import UploadFolderButton from '../../features/UploadFolderButton';
import FolderView from './FolderView';

export const Sidebar: React.FC = () => {
  const files = useAtomValue(filesAtom);
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom);
  const viewMode = useAtomValue(viewModeAtom);
  const [width, setWidth] = useState(300);
  const initialWidth = useRef(300);

  // useDrag 훅을 사용한 리사이징 처리
  const bind = useDrag(({ movement: [mx], first, last }) => {
    if (first) {
      initialWidth.current = width;
    }

    const newWidth = initialWidth.current + mx;
    if (newWidth >= 250 && newWidth <= 800) {
      setWidth(newWidth);
    }
  });

  if (!isSidebarOpen) {
    return null;
  }

  // IDE 모드: relative positioning for flex layout
  // Canvas 모드: absolute positioning for floating
  const positionClass = viewMode === 'ide'
    ? 'relative'
    : 'absolute top-0 left-0 z-50';

  return (
    <div
      className={`${positionClass} h-full bg-theme-sidebar border-r border-theme-border flex flex-col select-none shadow-2xl transition-transform duration-200 ease-out`}
      style={{ width: `${width}px` }}
    >
      {/* Compact Header */}
      <div className="px-2 py-1 border-b border-theme-border/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] text-theme-text-tertiary font-medium uppercase tracking-wide">
          <FolderTree className="w-2.5 h-2.5" />
          <span>Project</span>
        </div>
        <UploadFolderButton />
      </div>

      {/* Folder View */}
      <FolderView files={files} />

      {/* Resize Handle */}
      <div
        {...bind()}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-vibe-accent/50 active:bg-vibe-accent touch-none"
      />
    </div>
  );
};

export default Sidebar;
