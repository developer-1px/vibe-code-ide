import { Download, GitBranch, RotateCw, Upload } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/Select';

export function GitPanelHeader({
  currentBranch,
  changeBranch,
}: {
  currentBranch: string;
  changeBranch: (nextBranch: string) => void;
}) {
  function handleBranchValueChange(nextBranch: string) {
    changeBranch(nextBranch);
  }

  return (
    <div className="p-3 space-y-2 border-b border-border-DEFAULT">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch size={14} className="text-text-muted" />
          <span className="text-xs font-medium text-text-primary uppercase tracking-wide">Source Control</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Pull">
            <Download size={12} />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Push">
            <Upload size={12} />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Refresh">
            <RotateCw size={12} />
          </Button>
        </div>
      </div>

      <Select value={currentBranch} onValueChange={handleBranchValueChange}>
        <SelectTrigger className="h-8 text-xs">
          <GitBranch size={12} className="mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="main">main</SelectItem>
          <SelectItem value="develop">develop</SelectItem>
          <SelectItem value="feature/new-ui">feature/new-ui</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
