import { CanvasWorkspace } from './widgets/CanvasWorkspace/ui/CanvasWorkspace';

export function PageCanvas() {
  return (
    <div className="h-full w-full relative overflow-hidden">
      <CanvasWorkspace />
    </div>
  );
}
