/**
 * App Status Bar Widget
 * Bottom status bar with git info, cursor position, parsing progress, and AI status
 */

import { useAtomValue } from 'jotai';
import { parseProgressAtom } from '@/entities/AppView/model/atoms';
import { StatusBar } from './StatusBar';

export function AppStatusBar() {
  const parseProgress = useAtomValue(parseProgressAtom);

  // TODO: Replace with actual data from atoms
  // For now, using static values - to be connected to real state later
  const branch = 'main';
  const ahead = 0;
  const behind = 0;
  const line = 1;
  const column = 1;
  const aiActive = false;

  // Show parsing progress if loading
  const statusText = parseProgress.isLoading
    ? `Parsing... ${parseProgress.current}/${parseProgress.total} files`
    : undefined;

  return (
    <StatusBar
      branch={branch}
      ahead={ahead}
      behind={behind}
      line={line}
      column={column}
      aiActive={aiActive}
      statusText={statusText}
    />
  );
}
