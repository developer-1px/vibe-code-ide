import { useState } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';
import { Separator } from '@/shared/ui/Separator';
import type { Commit, FileChange } from './model/types';
import { GitChangeSection } from './widgets/GitChanges/ui/GitChangeSection';
import { GitCommitBox } from './widgets/GitCommit/ui/GitCommitBox';
import { GitHeader } from './widgets/GitHeader/ui/GitHeader';
import { GitHistorySection } from './widgets/GitHistory/ui/GitHistorySection';

export function PageGit() {
  const [commitMessage, setCommitMessage] = useState('');
  const [currentBranch, setCurrentBranch] = useState('main');
  const [fileChanges, setFileChanges] = useState<FileChange[]>([
    { path: 'src/app/ui/AppTitleBar/TitleBar.tsx', status: 'modified', staged: true },
    { path: 'src/pages/explorer/widgets/ExplorerSidebar/ui/ExplorerSidebar.tsx', status: 'modified', staged: true },
    { path: 'src/shared/ui/Button.tsx', status: 'modified', staged: false },
    { path: 'src/App.tsx', status: 'modified', staged: false },
    { path: 'src/utils/helpers.ts', status: 'added', staged: false },
    { path: 'README.md', status: 'deleted', staged: false },
  ]);

  const commits: Commit[] = [
    {
      hash: 'a1b2c3d',
      message: 'Add outline panel with symbol navigation',
      author: 'You',
      date: '2 hours ago',
    },
    {
      hash: 'e4f5g6h',
      message: 'Implement code view with syntax highlighting',
      author: 'You',
      date: '5 hours ago',
    },
    {
      hash: 'i7j8k9l',
      message: 'Initial LIMN design system setup',
      author: 'You',
      date: 'yesterday',
    },
  ];

  const stagedChanges = fileChanges.filter((fileChange) => fileChange.staged);
  const unstagedChanges = fileChanges.filter((fileChange) => !fileChange.staged);

  function handleFileStageToggle(path: string) {
    setFileChanges((prev) =>
      prev.map((fileChange) => (fileChange.path === path ? { ...fileChange, staged: !fileChange.staged } : fileChange))
    );
  }

  function handleStageAll() {
    setFileChanges((prev) => prev.map((fileChange) => ({ ...fileChange, staged: true })));
  }

  function handleUnstageAll() {
    setFileChanges((prev) => prev.map((fileChange) => ({ ...fileChange, staged: false })));
  }

  return (
    <div className="h-full min-h-0 w-full min-w-0 overflow-hidden bg-bg-surface border-r border-border-DEFAULT">
      <div className="flex h-full min-h-0 w-full flex-col">
        <GitHeader currentBranch={currentBranch} changeBranch={setCurrentBranch} />

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-3">
            <GitCommitBox
              commitMessage={commitMessage}
              stagedChangeCount={stagedChanges.length}
              changeCommitMessage={setCommitMessage}
            />

            <Separator />

            <GitChangeSection
              title="Staged Changes"
              emptyMessage="No staged changes"
              files={stagedChanges}
              allAction="unstage"
              toggleAll={handleUnstageAll}
              toggleFileStage={handleFileStageToggle}
            />
            <GitChangeSection
              title="Changes"
              emptyMessage="No changes"
              files={unstagedChanges}
              allAction="stage"
              toggleAll={handleStageAll}
              toggleFileStage={handleFileStageToggle}
            />

            <Separator />

            <GitHistorySection commits={commits} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
