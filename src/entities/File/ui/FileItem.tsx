import React from 'react';
import { FileText, Star } from 'lucide-react';

interface FileItemProps {
  fileName: string;
  isEntry: boolean;
  onSetEntryFile: (fileName: string) => void;
}

const FileItem: React.FC<FileItemProps> = ({
  fileName,
  isEntry,
  onSetEntryFile
}) => {
  return (
    <li
      onClick={() => onSetEntryFile(fileName)}
      className={`
        px-4 py-1.5 text-xs font-mono cursor-pointer flex items-center gap-2 border-l-2 transition-colors group
        ${isEntry
          ? 'bg-vibe-accent/10 text-vibe-accent border-vibe-accent'
          : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}
      `}
    >
      {/* Star icon - Entry file indicator */}
      <span title={isEntry ? "Entry file" : "Click to set as entry file"} className="flex-shrink-0 flex items-center">
        <Star className={`w-3 h-3 ${isEntry ? 'text-yellow-500 fill-yellow-500' : 'text-slate-500 group-hover:text-yellow-500'} transition-colors`} />
      </span>

      {/* File name with icon */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <FileText className="w-3 h-3 opacity-70 flex-shrink-0" />
        <span className="flex-1 truncate">{fileName}</span>
      </div>
    </li>
  );
};

export default FileItem;
