import type { ReactNode } from 'react';

interface ExportDropdownItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  runAction: () => void;
}

export function ExportDropdownItem({ icon, title, description, runAction }: ExportDropdownItemProps) {
  function handleClick() {
    runAction();
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-2xs text-text-secondary hover:bg-warm-500/10 hover:text-text-primary transition-colors"
    >
      {icon}
      <div className="flex flex-col items-start">
        <span className="font-medium">{title}</span>
        <span className="text-3xs text-text-tertiary">{description}</span>
      </div>
    </button>
  );
}
