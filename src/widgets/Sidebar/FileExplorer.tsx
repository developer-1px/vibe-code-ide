import React from 'react';
import { FolderOpen } from 'lucide-react';
import { FileItem } from '../../entities/File';
import UploadFolderButton from '../../features/UploadFolderButton';

interface FileExplorerProps {
  files: Record<string, string>;
  entryFile: string;
  onSetEntryFile: (fileName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  entryFile,
  onSetEntryFile
}) => {
  const sortedFiles = Object.keys(files).sort();

  return (
    <div className="flex-1 bg-[#0f172a] border-b border-vibe-border overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-1">
          <FolderOpen className="w-3 h-3" />
          <span>Explorer</span>
        </div>
        <UploadFolderButton />
      </div>

      {/* File List */}
      <ul className="flex-1 overflow-y-auto">
        {sortedFiles.map(fileName => (
          <FileItem
            key={fileName}
            fileName={fileName}
            isEntry={fileName === entryFile}
            onSetEntryFile={onSetEntryFile}
          />
        ))}
      </ul>
    </div>
  );
};

export default FileExplorer;
