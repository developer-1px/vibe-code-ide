import { useSetAtom } from 'jotai';
import { Badge } from '@/shared/ui/Badge';
import type { Slide } from '../../entities/Slide/model/types';
import { setCurrentSlideWithHistoryAtom } from '../../features/SlideNavigation/model/atoms';

/**
 * 슬라이드 컨텍스트 - Caller/Callee/Sibling 정보 표시
 */
const SlideContext = ({ slide }: { slide: Slide }) => {
  const { context } = slide;
  const setCurrentSlide = useSetAtom(setCurrentSlideWithHistoryAtom);

  const handleNavigate = (targetId: string) => {
    setCurrentSlide(targetId);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-bg-elevated border border-border-DEFAULT rounded-lg">
      {/* Callers - 위로 갈 수 있는 곳 */}
      <div>
        <div className="text-xs font-medium text-text-tertiary mb-2">↑ Callers ({context.callers.length})</div>
        {context.callers.length === 0 ? (
          <div className="text-xs text-text-faint italic">No callers found</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {context.callers.map((callerId) => (
              <FunctionBadge key={callerId} nodeId={callerId} onClick={() => handleNavigate(callerId)} />
            ))}
          </div>
        )}
      </div>

      {/* Callees - 아래로 갈 수 있는 곳 */}
      <div>
        <div className="text-xs font-medium text-text-tertiary mb-2">↓ Callees ({context.callees.length})</div>
        {context.callees.length === 0 ? (
          <div className="text-xs text-text-faint italic">No callees found</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {context.callees.map((calleeId) => (
              <FunctionBadge key={calleeId} nodeId={calleeId} onClick={() => handleNavigate(calleeId)} />
            ))}
          </div>
        )}
      </div>

      {/* Siblings - 좌우로 갈 수 있는 곳 */}
      <div>
        <div className="text-xs font-medium text-text-tertiary mb-2">← → Siblings ({context.siblings.length})</div>
        {context.siblings.length === 0 ? (
          <div className="text-xs text-text-faint italic">No siblings found</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {context.siblings.map((siblingId) => (
              <FunctionBadge
                key={siblingId}
                nodeId={siblingId}
                onClick={() => handleNavigate(siblingId)}
                isActive={siblingId === slide.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* 키보드 힌트 */}
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
};

/**
 * 함수 뱃지 - 클릭 가능한 함수 이름
 */
const FunctionBadge = ({
  nodeId,
  onClick,
  isActive = false,
}: {
  nodeId: string;
  onClick: () => void;
  isActive?: boolean;
}) => {
  // nodeId에서 함수 이름 추출 (filePath::functionName 형식)
  const functionName = nodeId.includes('::') ? nodeId.split('::').pop() || nodeId : nodeId.split('/').pop() || nodeId;

  return (
    <Badge
      variant={isActive ? 'active' : 'default'}
      className="cursor-pointer hover:bg-warm-active-hover transition-colors"
      onClick={onClick}
    >
      {functionName}
    </Badge>
  );
};

export default SlideContext;
