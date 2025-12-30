/**
 * Traditional Folder Tree View
 * VSCode-style folder structure with collapsible folders
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileCode, FileJson, Component } from 'lucide-react';
import { useAtomValue, useSetAtom } from 'jotai';
import { entryFileAtom, lastExpandedIdAtom } from '../../store/atoms';
import { openFile } from '../../features/File';
import UploadFolderButton from '../../features/UploadFolderButton';

interface FolderNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  filePath?: string; // file일 경우 전체 경로
}

// 확장자에 따른 아이콘 반환
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'vue':
      return { Icon: Component, color: 'text-emerald-400' };
    case 'tsx':
    case 'jsx':
      return { Icon: Component, color: 'text-blue-400' };
    case 'ts':
    case 'js':
      return { Icon: FileCode, color: 'text-yellow-400' };
    case 'json':
      return { Icon: FileJson, color: 'text-orange-400' };
    default:
      return { Icon: FileCode, color: 'text-slate-400' };
  }
};

const FolderView = ({ files }: { files: Record<string, string> }) => {
  const entryFile = useAtomValue(entryFileAtom);
  const setEntryFile = useSetAtom(entryFileAtom);
  const setLastExpandedId = useSetAtom(lastExpandedIdAtom);

  // 초기 상태: 모든 폴더를 접어둠
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => {
    const allFolders = new Set<string>();
    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split('/').filter(Boolean);
      for (let i = 0; i < parts.length - 1; i++) {
        const folderPath = parts.slice(0, i + 1).join('/');
        allFolders.add(folderPath);
      }
    });
    return allFolders;
  });

  // 파일 경로를 트리 구조로 변환
  const fileTree = useMemo(() => {
    const root: FolderNode = { name: 'root', path: '', type: 'folder', children: [] };

    Object.keys(files)
      .sort()
      .forEach((filePath) => {
        const parts = filePath.split('/').filter(Boolean);
        let currentNode = root;

        parts.forEach((part, index) => {
          const isFile = index === parts.length - 1;
          const currentPath = parts.slice(0, index + 1).join('/');

          if (!currentNode.children) {
            currentNode.children = [];
          }

          let childNode = currentNode.children.find((child) => child.name === part);

          if (!childNode) {
            childNode = {
              name: part,
              path: currentPath,
              type: isFile ? 'file' : 'folder',
              children: isFile ? undefined : [],
              filePath: isFile ? filePath : undefined,
            };
            currentNode.children.push(childNode);
          }

          if (!isFile) {
            currentNode = childNode;
          }
        });
      });

    // Folder 먼저, File 나중에 정렬
    const sortChildren = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.sort((a, b) => {
        // 폴더를 먼저
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        // 같은 타입이면 이름순
        return a.name.localeCompare(b.name);
      });
    };

    const sortTree = (node: FolderNode) => {
      if (node.children) {
        node.children = sortChildren(node.children);
        node.children.forEach(sortTree);
      }
    };

    if (root.children) {
      root.children = sortChildren(root.children);
      root.children.forEach(sortTree);
    }

    return root.children || [];
  }, [files]);

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = useCallback((filePath: string) => {
    openFile({
      filePath,
      currentEntryFile: entryFile,
      setEntryFile,
      setLastExpandedId,
    });
  }, [entryFile, setEntryFile, setLastExpandedId]);

  const renderNode = (node: FolderNode, depth: number = 0): React.ReactNode => {
    const isCollapsed = collapsedFolders.has(node.path);
    const paddingLeft = depth * 12 + 8; // 12px per level + 8px base

    if (node.type === 'file' && node.filePath) {
      const isEntry = node.filePath === entryFile;
      const { Icon: FileIcon, color: iconColor } = getFileIcon(node.filePath);

      return (
        <div
          key={node.path}
          onClick={() => handleFileClick(node.filePath!)}
          className={`flex items-center gap-1.5 py-0.5 px-2 text-[11px] cursor-pointer transition-colors border-l-2 ${
            isEntry
              ? 'text-vibe-accent border-vibe-accent'
              : 'text-slate-400 border-transparent'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <FileIcon className={`w-2.5 h-2.5 flex-shrink-0 opacity-40 ${isEntry ? 'text-vibe-accent opacity-70' : iconColor}`} />
          <span className={`font-medium truncate ${isEntry ? 'text-vibe-accent' : 'text-slate-300'}`}>
            {node.name}
          </span>
        </div>
      );
    }

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          {/* Folder Header */}
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1 py-0.5 px-2 text-[11px] text-slate-300 hover:bg-slate-700/40 cursor-pointer transition-colors group"
            style={{ paddingLeft: `${paddingLeft}px` }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-2.5 h-2.5 flex-shrink-0 text-slate-500" />
            ) : (
              <ChevronDown className="w-2.5 h-2.5 flex-shrink-0 text-slate-500" />
            )}
            {isCollapsed ? (
              <Folder className="w-2.5 h-2.5 flex-shrink-0 text-blue-400/70" />
            ) : (
              <FolderOpen className="w-2.5 h-2.5 flex-shrink-0 text-blue-400/70" />
            )}
            <span className="truncate font-medium">{node.name}</span>
            {node.children && (
              <span className="text-slate-600 text-[9px] ml-auto">({node.children.length})</span>
            )}
          </div>

          {/* Folder Children */}
          {!isCollapsed && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 bg-[#0f172a] border-b border-vibe-border overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 flex items-center justify-between bg-black/20 flex-shrink-0 border-b border-vibe-border/50">
        <div className="flex items-center gap-1">
          <FolderOpen className="w-2.5 h-2.5" />
          <span>Explorer</span>
        </div>
        <UploadFolderButton />
      </div>

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length > 0 ? (
          <div>{fileTree.map((node) => renderNode(node, 0))}</div>
        ) : (
          <div className="px-3 py-6 text-[11px] text-slate-500 text-center">No files</div>
        )}
      </div>
    </div>
  );
};

export default FolderView;
