import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useState } from 'react';
import { getJsonDatasetInterfaceCode } from '../../../entities/JsonDataset/lib/computed';
import type { JsonDatasetSchemaInterface } from '../../../entities/JsonDataset/lib/schema';
import { SchemaFieldRow } from './SchemaFieldRow';

export function SchemaInterfaceItem({
  node,
  isSelected,
  selectSchema,
}: {
  node: JsonDatasetSchemaInterface;
  isSelected: boolean;
  selectSchema: (path: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  }

  async function handleCopyInterface(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const interfaceCode = getJsonDatasetInterfaceCode(node);
      await navigator.clipboard.writeText(interfaceCode);
      setCopiedPath('interface');
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy interface:', error);
    }
  }

  function handleToggle() {
    if (isSelected) {
      selectSchema(null);
      setIsExpanded(false);
    } else {
      selectSchema(node.path);
      setIsExpanded(true);
    }
  }

  return (
    <div className="mb-2">
      <div
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-warm-500/10 transition-colors group ${
          isSelected ? 'bg-warm-500/20' : ''
        }`}
        onClick={handleToggle}
      >
        {isExpanded ? (
          <ChevronDown size={10} className="shrink-0 text-text-tertiary" />
        ) : (
          <ChevronRight size={10} className="shrink-0 text-text-tertiary" />
        )}
        <span className={`text-2xs font-semibold font-mono ${isSelected ? 'text-warm-400' : 'text-warm-300'}`}>
          interface {node.interfaceName}
        </span>
        <button
          onClick={handleCopyInterface}
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-bg-elevated rounded"
          title="Copy interface"
          aria-label="Copy interface"
        >
          <Copy size={10} className={copiedPath === 'interface' ? 'text-green-400' : 'text-text-tertiary'} />
        </button>
      </div>

      {!isExpanded && (
        <div className="text-2xs text-text-tertiary font-mono italic px-2 pl-7 pb-1">{node.path || 'root'}</div>
      )}

      {isExpanded && (
        <div className="pl-7 pr-2">
          <div className="text-2xs text-text-tertiary font-mono">{'{'}</div>

          {node.fields.map((field) => {
            const displayType = field.isArray ? `${field.type}[]` : field.type;
            const optional = field.isOptional ? '?' : '';
            const isPrimitive = ['string', 'number', 'boolean', 'null', 'unknown'].some(
              (primitiveType) => field.type === primitiveType || field.type.includes(primitiveType)
            );
            const typeColor = isPrimitive ? 'text-text-secondary' : 'text-cyan-400';

            return (
              <SchemaFieldRow
                key={field.name}
                fieldName={field.name}
                fullPath={field.fullPath}
                optional={optional}
                displayType={displayType}
                typeColor={typeColor}
                copiedPath={copiedPath}
                copyPath={copyPath}
              />
            );
          })}

          <div className="text-2xs text-text-tertiary font-mono">{'}'}</div>

          <div className="text-2xs text-warm-400/60 font-mono italic mt-1">
            {'// '}
            {node.path || 'root'}
          </div>
        </div>
      )}
    </div>
  );
}
