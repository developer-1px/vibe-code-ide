import { ScrollArea } from '@/shared/ui/ScrollArea';
import { Separator } from '@/shared/ui/Separator';
import { GitChangeSection } from '../../../features/GitChanges/ui/GitChangeSection';
import { GitCommitBox } from '../../../features/GitCommit/ui/GitCommitBox';
import { GitHeader } from '../../../features/GitHeader/ui/GitHeader';
import { GitHistorySection } from '../../../features/GitHistory/ui/GitHistorySection';
import type { Commit, FileChange } from '../../../model/types';

interface GitPanelProps {
  currentBranch: string;
  changeBranch: (branch: string) => void;
  commitMessage: string;
  changeCommitMessage: (message: string) => void;
  stagedChanges: FileChange[];
  unstagedChanges: FileChange[];
  commits: Commit[];
  stageAll: () => void;
  unstageAll: () => void;
  toggleFileStage: (path: string) => void;
}

export function GitPanel({
  currentBranch,
  changeBranch,
  commitMessage,
  changeCommitMessage,
  stagedChanges,
  unstagedChanges,
  commits,
  stageAll,
  unstageAll,
  toggleFileStage,
}: GitPanelProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <GitHeader currentBranch={currentBranch} changeBranch={changeBranch} />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          <GitCommitBox
            commitMessage={commitMessage}
            stagedChangeCount={stagedChanges.length}
            changeCommitMessage={changeCommitMessage}
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
