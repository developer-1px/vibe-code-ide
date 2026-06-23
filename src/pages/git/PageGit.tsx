import { useState } from 'react';
import type { Commit, FileChange } from './model/types';
import { GitPanel } from './widgets/GitPanel/ui/GitPanel';

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
      <GitPanel
        currentBranch={currentBranch}
        changeBranch={setCurrentBranch}
        commitMessage={commitMessage}
        changeCommitMessage={setCommitMessage}
        stagedChanges={stagedChanges}
        unstagedChanges={unstagedChanges}
        commits={commits}
        stageAll={handleStageAll}
        unstageAll={handleUnstageAll}
        toggleFileStage={handleFileStageToggle}
      />
    </div>
  );
}
