import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FileItem } from '../../entities/File';
import UploadFolderButton from '../../features/UploadFolderButton';

interface FileExplorerProps {
  files: Record<string, string>;
  activeFile: string;
  entryFile: string;
  onFileClick: (fileName: string) => void;
  onSetEntryFile: (fileName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFile,
  entryFile,
  onFileClick,
  onSetEntryFile
}) => {
  const sortedFiles = Object.keys(files).sort();

  return (
    <div className="bg-[#0f172a] border-b border-vibe-border max-h-64 overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-1">
          <FolderOpen className="w-3 h-3" />
          <span>Explorer</span>
        </div>
        <UploadFolderButton />
      </div>

      {/* File List */}
      <ul>
        {sortedFiles.map(fileName => (
          <FileItem
            key={fileName}
            fileName={fileName}
            isActive={activeFile === fileName}
            isEntry={fileName === entryFile}
            onFileClick={onFileClick}
            onSetEntryFile={onSetEntryFile}
          />
        ))}
      </ul>
    </div>
  );
};

export default FileExplorer;
