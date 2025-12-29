
import React from 'react';
import { useAtom } from 'jotai';
import { Box as IconBox, AlertCircle as IconAlertCircle, PanelLeft as IconPanelLeft } from 'lucide-react';
import { isSidebarOpenAtom } from '../../store/atoms.ts';
import { useGraphData } from '../../hooks/useGraphData';

const Header: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(isSidebarOpenAtom);
  const { error: parseError } = useGraphData();

  return (
    <header className="h-14 bg-vibe-panel/50 backdrop-blur border-b border-vibe-border flex items-center px-6 justify-between relative z-0 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${!isSidebarOpen ? 'text-vibe-accent bg-vibe-accent/10' : ''}`}
          title="Toggle Sidebar (Cmd/Ctrl + \)"
        >
          <IconPanelLeft className="w-4 h-4" />
        </button>

        <h2 className="font-semibold text-slate-200 flex items-center gap-2">
          <IconBox className="w-4 h-4 text-vibe-purple" />
          <span className="text-slate-500 font-normal">Logic Visualization</span>
        </h2>
      </div>

      <div className="flex gap-2 items-center text-xs">
        {parseError ? (
          <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded border border-red-500/20 flex items-center gap-1">
            <IconAlertCircle className="w-3 h-3" />
            Syntax Error
          </span>
        ) : (
          <span className="px-2 py-1 bg-vibe-accent/10 text-vibe-accent rounded border border-vibe-accent/20">
            Project Analysis Active
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
