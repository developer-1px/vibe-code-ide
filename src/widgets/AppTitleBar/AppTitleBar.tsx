/**
 * App Title Bar Widget
 * Top title bar with window controls and file name
 */

import { TitleBar } from '@/components/ide/TitleBar';

export function AppTitleBar() {
  // Get active file name for TitleBar
  const activeFileName = 'vibe-coding-ide';

  return <TitleBar filename={activeFileName} projectName="teo.v" />;
}
