import type { Slide } from '../../../entities/Slide/model/types';
import { SlideFunctionBadge } from '../../../features/SlideContextPanel/ui/SlideFunctionBadge';

export function SlideContextPanel({ slide }: { slide: Slide }) {
  const { context } = slide;

  return (
    <div className="flex flex-col gap-4 p-4 bg-bg-elevated border border-border-DEFAULT rounded-lg">
      <div>
        <div className="text-xs font-medium text-text-tertiary mb-2">↑ Callers ({context.callers.length})</div>
        {context.callers.length === 0 ? (
          <div className="text-xs text-text-faint italic">No callers found</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {context.callers.map((callerId) => (
              <SlideFunctionBadge key={callerId} nodeId={callerId} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-medium text-text-tertiary mb-2">↓ Callees ({context.callees.length})</div>
        {context.callees.length === 0 ? (
          <div className="text-xs text-text-faint italic">No callees found</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {context.callees.map((calleeId) => (
              <SlideFunctionBadge key={calleeId} nodeId={calleeId} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-medium text-text-tertiary mb-2">← → Siblings ({context.siblings.length})</div>
        {context.siblings.length === 0 ? (
          <div className="text-xs text-text-faint italic">No siblings found</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {context.siblings.map((siblingId) => (
              <SlideFunctionBadge key={siblingId} nodeId={siblingId} isActive={siblingId === slide.id} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border-DEFAULT pt-4 mt-2">
        <div className="text-xs text-text-faint">
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-2 py-1 bg-bg-base border border-border-DEFAULT rounded text-2xs">↑</kbd>
            <span>Go to Caller</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-2 py-1 bg-bg-base border border-border-DEFAULT rounded text-2xs">↓</kbd>
            <span>Go to Callee</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <kbd className="px-2 py-1 bg-bg-base border border-border-DEFAULT rounded text-2xs">←</kbd>
            <kbd className="px-2 py-1 bg-bg-base border border-border-DEFAULT rounded text-2xs">→</kbd>
            <span>Navigate Siblings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
