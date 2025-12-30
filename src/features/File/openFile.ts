/**
 * File opening utilities - shared logic for FileExplorer and Search
 */

import type { SetStateAction } from 'jotai';

interface OpenFileParams {
  filePath: string;
  currentEntryFile: string;
  setEntryFile: (update: SetStateAction<string>) => void;
  setLastExpandedId: (update: SetStateAction<string | null>) => void;
}

/**
 * Open a file in the editor
 * If the file is already the entry file, navigate to its FILE_ROOT
 * Otherwise, set it as the new entry file
 */
export function openFile({
  filePath,
  currentEntryFile,
  setEntryFile,
  setLastExpandedId,
}: OpenFileParams): void {
  if (filePath === currentEntryFile) {
    // Already entry file → navigate to FILE_ROOT
    const fileRootId = `${filePath}::FILE_ROOT`;
    setLastExpandedId(fileRootId);
  } else {
    // Set as new entry file
    setEntryFile(filePath);
  }
}
