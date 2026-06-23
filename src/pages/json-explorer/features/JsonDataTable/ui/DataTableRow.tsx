import { flexRender, type Row } from '@tanstack/react-table';

interface DataTableRowProps {
  row: Row<Record<string, unknown>>;
  rowIndex: number;
  selectedRowIndex?: number | null;
  measureElement: (node: Element | null) => void;
  selectRow?: (index: number, data: Record<string, unknown>) => void;
}

export function DataTableRow({ row, rowIndex, selectedRowIndex, measureElement, selectRow }: DataTableRowProps) {
  const isSelected = selectedRowIndex === rowIndex;

  function handleClick() {
    selectRow?.(rowIndex, row.original);
  }

  return (
    <tr
      key={row.id}
      className={`h-6 border-b border-border-DEFAULT transition-colors cursor-pointer ${
        isSelected ? 'bg-warm-500/20' : 'hover:bg-warm-500/10'
      }`}
      data-index={rowIndex}
      ref={measureElement}
      onClick={handleClick}
    >
      {row.getVisibleCells().map((cell) => {
        const width = cell.column.getSize();
        return (
          <td
            key={cell.id}
            className="px-3 py-0.5 text-2xs align-middle overflow-hidden border-r border-border-DEFAULT"
            style={{ width: `${width}px` }}
          >
            <div className="truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
          </td>
        );
      })}
    </tr>
  );
}
