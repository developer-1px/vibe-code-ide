import React, { useMemo } from 'react';
import { FileText, Star } from 'lucide-react';

interface FileItemProps {
  fileName: string;
  isEntry: boolean;
  isFocused: boolean;
  searchQuery: string;
  onSetEntryFile: (fileName: string) => void;
  onMouseEnter: () => void;
}

const FileItem: React.FC<FileItemProps> = ({
  fileName,
  isEntry,
  isFocused,
  searchQuery,
  onSetEntryFile,
  onMouseEnter
}) => {
  // 파일명과 폴더 경로 분리
  const { name, folder } = useMemo(() => {
    const lastSlash = fileName.lastIndexOf('/');
    if (lastSlash === -1) {
      return { name: fileName, folder: '' };
    }
    return {
      name: fileName.slice(lastSlash + 1),
      folder: fileName.slice(0, lastSlash)
    };
  }, [fileName]);

  // Fuzzy matching으로 하이라이트할 인덱스 찾기
  const getFuzzyMatchIndices = (text: string, query: string): number[] => {
    if (!query.trim()) return [];

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const indices: number[] = [];

    let queryIndex = 0;

    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        indices.push(i);
        queryIndex++;
      }
    }

    return queryIndex === lowerQuery.length ? indices : [];
  };

  // 검색어 하이라이트를 위한 파일명 분리 (Fuzzy)
  const highlightedName = useMemo(() => {
    const matchIndices = getFuzzyMatchIndices(name, searchQuery);
    if (matchIndices.length === 0) return [{ text: name, isHighlight: false }];

    const matchSet = new Set(matchIndices);
    return name.split('').map((char, index) => ({
      text: char,
      isHighlight: matchSet.has(index)
    }));
  }, [name, searchQuery]);

  // 폴더 경로도 하이라이트 (Fuzzy)
  const highlightedFolder = useMemo(() => {
    if (!folder) return [{ text: '', isHighlight: false }];

    const matchIndices = getFuzzyMatchIndices(folder, searchQuery);
    if (matchIndices.length === 0) return [{ text: folder, isHighlight: false }];

    const matchSet = new Set(matchIndices);
    return folder.split('').map((char, index) => ({
      text: char,
      isHighlight: matchSet.has(index)
    }));
  }, [folder, searchQuery]);

  return (
    <li
      onClick={() => onSetEntryFile(fileName)}
      onMouseEnter={onMouseEnter}
      className={`
        px-3 py-1 text-[11px] font-mono cursor-pointer flex items-center gap-2 border-l-2 transition-colors group
        ${isEntry
          ? 'bg-vibe-accent/10 text-vibe-accent border-vibe-accent'
          : isFocused
          ? 'bg-blue-500/10 text-slate-200 border-blue-500'
          : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-slate-200'}
      `}
    >
      {/* Star icon - Entry file indicator */}
      <span title={isEntry ? "Entry file - Click to navigate" : "Click to set as entry file"} className="flex-shrink-0 flex items-center">
        <Star className={`w-2.5 h-2.5 ${isEntry ? 'text-yellow-500 fill-yellow-500' : 'text-slate-500 group-hover:text-yellow-500'} transition-colors`} />
      </span>

      {/* File name with icon (왼쪽) */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <FileText className={`w-2.5 h-2.5 opacity-70 flex-shrink-0 ${isEntry ? 'text-vibe-accent' : ''}`} />
        <span className={`font-medium ${isEntry ? 'text-vibe-accent' : isFocused ? 'text-slate-100' : 'text-slate-200'}`}>
          {highlightedName.map((part, i) => (
            part.isHighlight ? (
              <mark key={i} className="bg-yellow-400/30 text-yellow-200">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            )
          ))}
        </span>
      </div>

      {/* Folder path (오른쪽) */}
      {folder && (
        <span className="ml-auto text-[10px] text-slate-500 truncate">
          {highlightedFolder.map((part, i) => (
            part.isHighlight ? (
              <mark key={i} className="bg-yellow-400/30 text-yellow-200">
                {part.text}
              </mark>
            ) : (
              <span key={i}>{part.text}</span>
            )
          ))}
        </span>
      )}
    </li>
  );
};

export default FileItem;
