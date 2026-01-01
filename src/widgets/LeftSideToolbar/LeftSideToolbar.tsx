import React from 'react';
import { useSetAtom } from 'jotai';
import { FolderOpen } from 'lucide-react';
import { isSidebarOpenAtom } from '../../store/atoms';

/**
 * LeftSideToolbar - Compact icon toolbar
 */
const LeftSideToolbar = () => {
  const setIsSidebarOpen = useSetAtom(isSidebarOpenAtom);

  return (
    <div className="w-[40px] h-full bg-theme-panel border-r border-theme-border flex flex-col items-center py-1.5 gap-0.5 flex-shrink-0">
      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(prev => !prev)}
        className="w-8 h-8 rounded-md flex items-center justify-center text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-hover transition-all"
        title="Toggle Files Panel"
      >
        <FolderOpen className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LeftSideToolbar;
