
import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Box, FileCode, FileText, FolderOpen, Star } from 'lucide-react';
import { filesAtom, activeFileAtom, entryFileAtom } from '../store/atoms';
import UploadFolderButton from '../features/UploadFolderButton';
import ResetFilesButton from '../features/ResetFilesButton';

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

  const sortedFiles = Object.keys(files).sort();

  return (
    <div className="w-[400px] bg-vibe-panel border-r border-vibe-border flex flex-col h-full select-none shadow-xl z-20">
      <div className="p-4 border-b border-vibe-border bg-[#162032]">
        <h1 className="font-bold text-slate-100 flex items-center gap-2 mb-1">
          <Box className="w-5 h-5 text-vibe-accent" />
          Vibe Coder
        </h1>
        <p className="text-xs text-slate-500">Project Logic Visualization</p>
      </div>

      {/* File Explorer */}
      <div className="bg-[#0f172a] border-b border-vibe-border max-h-64 overflow-y-auto">
        <div className="px-4 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            <span>Explorer</span>
          </div>
          <UploadFolderButton />
        </div>
        <ul>
          {sortedFiles.map(fileName => {
            const isEntry = fileName === entryFile;
            return (
              <li
                key={fileName}
                className={`
                  px-4 py-1.5 text-xs font-mono cursor-pointer flex items-center gap-2 border-l-2 transition-colors group
                  ${activeFile === fileName
                    ? 'bg-vibe-accent/10 text-vibe-accent border-vibe-accent'
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}
                `}
              >
                {/* Star icon on the left */}
                {isEntry ? (
                  <span title="Entry file" className="flex-shrink-0 flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  </span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEntryFile(fileName);
                    }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Set as entry file"
                  >
                    <Star className="w-3 h-3 text-slate-500 hover:text-yellow-500 transition-colors" />
                  </button>
                )}

                <div onClick={() => setActiveFile(fileName)} className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-3 h-3 opacity-70 flex-shrink-0" />
                  <span className="flex-1 truncate">{fileName}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

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
