import { Copy } from 'lucide-react';

interface SchemaFieldRowProps {
  fieldName: string;
  fullPath: string;
  optional: string;
  displayType: string;
  typeColor: string;
  copiedPath: string | null;
  copyPath: (path: string, e: React.MouseEvent) => void;
}

export function SchemaFieldRow({
  fieldName,
  fullPath,
  optional,
  displayType,
  typeColor,
  copiedPath,
  copyPath,
}: SchemaFieldRowProps) {
  function handleCopyPathClick(e: React.MouseEvent) {
    copyPath(fullPath, e);
  }

  return (
    <div className="flex items-center gap-1.5 py-0.5 hover:bg-warm-500/5 group">
      <span className="text-2xs font-mono text-warm-400 pl-2">
        {fieldName}
        {optional}:
      </span>
      <span className={`text-2xs font-mono ${typeColor}`}>{displayType};</span>
      <button
        onClick={handleCopyPathClick}
        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-bg-elevated rounded shrink-0"
        title={`Copy path: ${fullPath}`}
        aria-label="Copy path"
      >
        <Copy size={9} className={copiedPath === fullPath ? 'text-green-400' : 'text-text-tertiary'} />
      </button>
    </div>
  );
}
