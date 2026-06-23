import { useSetAtom } from 'jotai';
import { Badge } from '@/shared/ui/Badge';
import { setCurrentSlideWithHistoryAtom } from '../../SlideNavigation/model/atoms';

interface SlideFunctionBadgeProps {
  nodeId: string;
  isActive?: boolean;
}

export function SlideFunctionBadge({ nodeId, isActive = false }: SlideFunctionBadgeProps) {
  const setCurrentSlide = useSetAtom(setCurrentSlideWithHistoryAtom);
  const functionName = nodeId.includes('::') ? nodeId.split('::').pop() || nodeId : nodeId.split('/').pop() || nodeId;

  function handleClick() {
    setCurrentSlide(nodeId);
  }

  return (
    <Badge
      variant={isActive ? 'active' : 'default'}
      className="cursor-pointer hover:bg-warm-active-hover transition-colors"
      onClick={handleClick}
    >
      {functionName}
    </Badge>
  );
}
