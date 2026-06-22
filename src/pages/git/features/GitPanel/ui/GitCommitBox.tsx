import { GitCommit } from 'lucide-react';
import type React from 'react';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';

export function GitCommitBox({
  commitMessage,
  stagedChangeCount,
  changeCommitMessage,
}: {
  commitMessage: string;
  stagedChangeCount: number;
  changeCommitMessage: (nextMessage: string) => void;
}) {
  function handleCommitMessageChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    changeCommitMessage(e.target.value);
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Commit message..."
        value={commitMessage}
        onChange={handleCommitMessageChange}
        className="min-h-15 text-xs resize-none"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs bg-warm-300 text-bg-deep hover:bg-warm-300/90"
          disabled={!commitMessage || stagedChangeCount === 0}
        >
          <GitCommit size={12} className="mr-1" />
          Commit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          disabled={!commitMessage || stagedChangeCount === 0}
        >
          <GitCommit size={12} className="mr-1" />
          Commit & Push
        </Button>
      </div>
    </div>
  );
}
