import { CanvasWorkspace } from './widgets/CanvasWorkspace/ui/CanvasWorkspace';

export function PageCanvas() {
  return (
    <div className="h-full min-h-0 w-full min-w-0 relative overflow-hidden">
      <CanvasWorkspace />
    </div>
  );
}
