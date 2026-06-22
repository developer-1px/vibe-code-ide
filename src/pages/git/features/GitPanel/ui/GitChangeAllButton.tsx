import { Minus, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface GitChangeAllButtonProps {
  allAction: 'stage' | 'unstage';
  toggleAll: () => void;
}

export function GitChangeAllButton({ allAction, toggleAll }: GitChangeAllButtonProps) {
  const AllActionIcon = allAction === 'stage' ? Plus : Minus;
  const allActionLabel = allAction === 'stage' ? 'Stage All' : 'Unstage All';

  function handleClick() {
    toggleAll();
  }

  return (
    <Button variant="ghost" size="sm" className="h-5 px-1 text-2xs" onClick={handleClick}>
      <AllActionIcon size={10} className="mr-0.5" />
      {allActionLabel}
    </Button>
  );
}
