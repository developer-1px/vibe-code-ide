import React from 'react';
import { Component, FileCode, FileJson } from 'lucide-react';

interface FolderNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  filePath?: string;
}

interface FileItemViewProps {
  node: FolderNode;
  depth: number;
  isFocused: boolean;
  onFileClick: (filePath: string) => void;
  onFileFocus: (filePath: string) => void;
}

// 확장자에 따른 아이콘 반환
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'vue':
      return { Icon: Component, color: 'text-emerald-400' };
    case 'tsx':
    case 'jsx':
      return { Icon: Component, color: 'text-purple-400' };
    case 'ts':
    case 'js':
      return { Icon: FileCode, color: 'text-yellow-400' };
    case 'json':
      return { Icon: FileJson, color: 'text-orange-400' };
    default:
      return { Icon: FileCode, color: 'text-gray-400' };
  }
};

const FileItemView: React.FC<FileItemViewProps> = ({ node, depth, isFocused, onFileClick, onFileFocus }) => {
  // 파일은 폴더보다 한 단계 더 들여쓰기 (chevron 공간 + 추가 indent)
  const paddingLeft = depth * 12 + 8 + 16;
  const { Icon: FileIcon, color: iconColor } = getFileIcon(node.filePath!);

  const handleClick = () => {
    // Single click - update focus
    if (node.filePath) {
      onFileFocus(node.filePath);
    }
  };

  const handleDoubleClick = () => {
    // Double click - open file
    if (node.filePath) {
      onFileClick(node.filePath);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`flex items-center gap-1.5 py-0.5 px-2 text-[11px] cursor-pointer transition-colors border-l-2 ${
        isFocused
          ? 'text-gray-200 border-gray-500 bg-white/10'
          : 'text-gray-400 border-transparent'
      }`}
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      <FileIcon className={`w-2.5 h-2.5 flex-shrink-0 opacity-40 ${isFocused ? 'text-gray-300 opacity-70' : iconColor}`} />
      <span className={`font-medium truncate ${isFocused ? 'text-gray-200' : 'text-gray-400'}`}>
        {node.name}
      </span>
    </div>
  );
};

export default FileItemView;
