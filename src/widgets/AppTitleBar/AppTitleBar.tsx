/**
 * App Title Bar Widget
 * Top title bar with window controls and file name
 */

import { useAtomValue } from 'jotai';
import React from 'react';
import { TitleBar } from '@/components/ide/TitleBar';
import { activeTabAtom } from '@/features/File/OpenFiles/model/atoms';

export function AppTitleBar() {
  // Get active file name for TitleBar
  const activeFileName = 'vibe-coding-ide';

  return <TitleBar filename={activeFileName} projectName="teo.v" />;
}
