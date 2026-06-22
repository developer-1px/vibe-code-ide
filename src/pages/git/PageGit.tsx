import { GitPanel } from './widgets/GitPanel/ui/GitPanel';

export function PageGit() {
  return (
    <div className="h-full min-h-0 w-full min-w-0 overflow-hidden">
      <GitPanel className="w-full" />
    </div>
  );
}
