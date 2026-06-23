import { CanvasBoard } from './widgets/CanvasBoard/ui/CanvasBoard.tsx';

export function PageCanvas() {
  return (
    <div className="h-full min-h-0 w-full min-w-0 relative overflow-hidden">
      <CanvasBoard />
    </div>
  );
}
