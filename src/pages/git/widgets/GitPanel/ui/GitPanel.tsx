import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { ScrollArea } from '@/shared/ui/ScrollArea';
import { Separator } from '@/shared/ui/Separator';
import type { Commit, FileChange } from '../model/types';
import { GitChangeSection } from './GitChangeSection';
import { GitCommitBox } from './GitCommitBox';
import { GitHistorySection } from './GitHistorySection';
import { GitPanelHeader } from './GitPanelHeader';

export interface GitPanelProps {
  className?: string;
}

export function GitPanel({ className }: GitPanelProps) {
  const [commitMessage, setCommitMessage] = React.useState('');
  const [currentBranch, setCurrentBranch] = React.useState('main');

  const [fileChanges, setFileChanges] = React.useState<FileChange[]>([
    { path: 'src/app/ui/AppTitleBar/TitleBar.tsx', status: 'modified', staged: true },
    { path: 'src/pages/explorer/widgets/ExplorerWorkspace/ui/ExplorerSidebar.tsx', status: 'modified', staged: true },
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

  const stagedChanges = fileChanges.filter((f) => f.staged);
  const unstagedChanges = fileChanges.filter((f) => !f.staged);

  function toggleFileStage(path: string) {
    setFileChanges((prev) => prev.map((f) => (f.path === path ? { ...f, staged: !f.staged } : f)));
  }

  function stageAll() {
    setFileChanges((prev) => prev.map((f) => ({ ...f, staged: true })));
  }

  function unstageAll() {
    setFileChanges((prev) => prev.map((f) => ({ ...f, staged: false })));
  }

  return (
    <div className={cn('flex h-full flex-col bg-bg-surface border-r border-border-DEFAULT', className)}>
      <GitPanelHeader currentBranch={currentBranch} changeBranch={setCurrentBranch} />

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
            toggleAll={unstageAll}
            toggleFileStage={toggleFileStage}
          />
          <GitChangeSection
            title="Changes"
            emptyMessage="No changes"
            files={unstagedChanges}
            allAction="stage"
            toggleAll={stageAll}
            toggleFileStage={toggleFileStage}
          />

          <Separator />

          <GitHistorySection commits={commits} />
        </div>
      </ScrollArea>
    </div>
  );
}
