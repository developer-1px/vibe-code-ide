/**
 * File opening utilities - shared logic for FileExplorer and Search
 */

import type { SetStateAction } from 'jotai';

interface OpenFileParams {
  filePath: string;
  currentEntryFile: string;
  setEntryFile: (update: SetStateAction<string>) => void;
  setLastExpandedId: (update: SetStateAction<string | null>) => void;
  openedFiles?: Set<string>;
  setOpenedFiles?: (update: SetStateAction<Set<string>>) => void;
}

/**
 * Open a file in the editor
 * Adds file to openedFiles for multi-file overlay view
 */
export function openFile({
  filePath,
  currentEntryFile,
  setEntryFile,
  setLastExpandedId,
  openedFiles,
  setOpenedFiles,
}: OpenFileParams): void {
  // Only add to opened files (don't change entryFile to avoid re-parsing)
  if (openedFiles && setOpenedFiles) {
    const newOpenedFiles = new Set(openedFiles);
    newOpenedFiles.add(filePath);
    setOpenedFiles(newOpenedFiles);
  }
}
