import { ChevronDown, ChevronRight, Copy, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';
import type { SchemaInterfaceNode } from '../lib/extractKeyPaths';

interface JsonExplorerSchemaSectionProps {
  schemaInterfaces: SchemaInterfaceNode[];
  selectedSchema: string | null;
  selectSchema: (schemaPath: string | null) => void;
}

function SchemaInterfaceItem({
  node,
  isSelected,
  selectSchema,
}: {
  node: SchemaInterfaceNode;
  isSelected: boolean;
  selectSchema: (path: string | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  async function handleCopyPath(path: string, e: React.MouseEvent) {
    e.stopPropagation();
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
      const interfaceCode = `interface ${node.interfaceName} {\n${node.fields
        .map((field) => {
          const displayType = field.isArray ? `${field.type}[]` : field.type;
          const optional = field.isOptional ? '?' : '';
          return `  ${field.name}${optional}: ${displayType};`;
        })
        .join('\n')}\n}`;
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

  function handleFieldCopyPath(path: string, e: React.MouseEvent) {
    handleCopyPath(path, e);
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
                copyPath={handleFieldCopyPath}
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

function SchemaFieldRow({
  fieldName,
  fullPath,
  optional,
  displayType,
  typeColor,
  copiedPath,
  copyPath,
}: {
  fieldName: string;
  fullPath: string;
  optional: string;
  displayType: string;
  typeColor: string;
  copiedPath: string | null;
  copyPath: (path: string, e: React.MouseEvent) => void;
}) {
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

export function JsonExplorerSchemaSection({
  schemaInterfaces,
  selectedSchema,
  selectSchema,
}: JsonExplorerSchemaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  return (
    <div className="border-b border-border-DEFAULT flex flex-col overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-bg-deep cursor-pointer hover:bg-bg-deep/80 transition-colors shrink-0"
        onClick={handleToggle}
      >
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <GitBranch size={12} className="text-warm-300" />
        <h2 className="text-xs font-semibold text-text-primary">Schema</h2>
        <span className="text-3xs text-text-tertiary ml-auto">{schemaInterfaces.length} interfaces</span>
      </div>

      {isExpanded && (
        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="py-2">
            {schemaInterfaces.map((interfaceNode) => (
              <SchemaInterfaceItem
                key={interfaceNode.path}
                node={interfaceNode}
                isSelected={selectedSchema === interfaceNode.path}
                selectSchema={selectSchema}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
