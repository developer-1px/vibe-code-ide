import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Box, FileCode } from 'lucide-react';
import { filesAtom, activeFileAtom, entryFileAtom } from '../../store/atoms';
import ResetFilesButton from '../../features/ResetFilesButton';
import FileExplorer from './FileExplorer';

const Sidebar: React.FC = () => {
  const [files, setFiles] = useAtom(filesAtom);
  const [activeFile, setActiveFile] = useAtom(activeFileAtom);
  const [entryFile, setEntryFile] = useAtom(entryFileAtom);

  const [localCode, setLocalCode] = useState(files[activeFile] || '');
  const [isTyping, setIsTyping] = useState(false);

  // Handler: File content change
  const handleFileChange = (fileName: string, content: string) => {
    setFiles(prev => ({
      ...prev,
      [fileName]: content
    }));
  };

  // Sync local code when active file changes
  useEffect(() => {
    setLocalCode(files[activeFile] || '');
  }, [activeFile, files]);

  // Debounce logic
  useEffect(() => {
    setIsTyping(true);
    const handler = setTimeout(() => {
      if (files[activeFile] !== localCode) {
        handleFileChange(activeFile, localCode);
      }
      setIsTyping(false);
    }, 800);

    return () => clearTimeout(handler);
  }, [localCode, activeFile]);

  return (
    <div className="w-[400px] bg-vibe-panel border-r border-vibe-border flex flex-col h-full select-none shadow-xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-vibe-border bg-[#162032]">
        <h1 className="font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Box className="w-5 h-5 text-vibe-accent" />
          Vibe Coder
        </h1>
        <p className="text-xs text-slate-500">Project Logic Visualization</p>
      </div>

      {/* File Explorer */}
      <FileExplorer
        files={files}
        activeFile={activeFile}
        entryFile={entryFile}
        onFileClick={setActiveFile}
        onSetEntryFile={setEntryFile}
      />

      {/* Editor */}
      <div className="flex-1 relative group flex flex-col min-h-0">
        <div className="px-4 py-1 bg-[#162032] text-[10px] text-slate-500 font-mono border-b border-white/5 truncate">
          {activeFile}
        </div>
        <textarea
          className="flex-1 w-full bg-[#0b1221] text-xs font-mono text-slate-300 p-4 resize-none focus:outline-none focus:ring-1 focus:ring-vibe-accent/50 leading-relaxed scrollbar-hide selection:bg-vibe-accent/30"
          value={localCode}
          spellCheck={false}
          onChange={(e) => setLocalCode(e.target.value)}
        />

        {/* Status Indicator */}
        <div className="absolute bottom-4 right-4 pointer-events-none transition-opacity duration-300">
          {isTyping ? (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full border border-yellow-500/20 animate-pulse">
              Typing...
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full border border-emerald-500/20">
              Synced
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-vibe-border bg-[#162032] flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FileCode className="w-3 h-3" />
          <span>Vue 3 / TS Project</span>
        </div>
        <ResetFilesButton />
      </div>
    </div>
  );
};

export default Sidebar;
