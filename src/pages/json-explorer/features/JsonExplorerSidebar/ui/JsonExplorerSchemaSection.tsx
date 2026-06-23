import { ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';
import type { JsonDatasetSchemaInterface } from '../../../entities/JsonDataset/lib/schema';
import { SchemaInterfaceItem } from './SchemaInterfaceItem';

interface JsonExplorerSchemaSectionProps {
  schemaInterfaces: JsonDatasetSchemaInterface[];
  selectedSchema: string | null;
  selectSchema: (schemaPath: string | null) => void;
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
    <div className="min-h-0 border-b border-border-DEFAULT flex flex-col overflow-hidden">
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
        <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
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
