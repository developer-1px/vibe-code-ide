import type { Header } from '@tanstack/react-table';
import type React from 'react';

interface DataTableResizeHandleProps {
  header: Header<Record<string, unknown>, unknown>;
}

export function DataTableResizeHandle({ header }: DataTableResizeHandleProps) {
  function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    header.getResizeHandler()(event);
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    header.getResizeHandler()(event);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-warm-400 ${
        header.column.getIsResizing() ? 'bg-warm-400' : ''
      }`}
    />
  );
}
