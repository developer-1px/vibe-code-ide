import type { FocusedPane } from '@/entities/AppView/model/atoms';
import type { OpenFileOptions } from '@/features/File/OpenFiles/lib/useOpenFile';
import type { SearchResult } from '../model/types';

type OpenFile = (filePath: string, options?: OpenFileOptions) => void;
type ChangeCollapsedFolders = (update: Set<string> | ((previous: Set<string>) => Set<string>)) => void;

interface SelectSearchResultDeps {
  openFile: OpenFile;
  changeCollapsedFolders: ChangeCollapsedFolders;
  changeFocusedPane: (pane: FocusedPane) => void;
}

export function selectSearchResult(result: SearchResult, deps: SelectSearchResultDeps) {
  if (result.type === 'file') {
    deps.openFile(result.filePath);
    return;
  }

  if (result.type === 'folder') {
    selectFolderResult(result, deps);
    return;
  }

  selectSymbolResult(result, deps.openFile);
}

function selectFolderResult(result: SearchResult, deps: SelectSearchResultDeps) {
  const foldersToOpen = getFoldersToOpen(result.filePath);

  deps.changeCollapsedFolders((previous) => {
    const next = new Set(previous);
    for (const folder of foldersToOpen) {
      next.delete(folder);
    }
    return next;
  });

  deps.changeFocusedPane('sidebar');
}

function getFoldersToOpen(folderPath: string) {
  const parts = folderPath.split('/');
  const foldersToOpen: string[] = [];

  for (let i = 1; i <= parts.length; i++) {
    const parentFolder = parts.slice(0, i).join('/');
    if (parentFolder) {
      foldersToOpen.push(parentFolder);
    }
  }

  return foldersToOpen;
}

function selectSymbolResult(result: SearchResult, openFile: OpenFile) {
  console.log('[SearchResults] CodeSymbol selected:', {
    name: result.name,
    nodeId: result.nodeId,
    filePath: result.filePath,
    lineNumber: result.lineNumber,
    nodeType: result.nodeType,
  });

  if (result.nodeType === 'usage') {
    openFile(result.filePath, {
      lineNumber: result.lineNumber,
    });
    return;
  }

  openFile(result.filePath, {
    lineNumber: result.lineNumber || 0,
    focusSymbol: result.name,
    focusPane: 'canvas',
  });

  console.log('[SearchResults] Activated focus mode for:', result.name, 'in file:', result.filePath);
}
