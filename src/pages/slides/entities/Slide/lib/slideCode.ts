import type { CodeLine } from '@/entities/CodeLine/model/types';
import type { GraphData, SourceFileNode } from '@/entities/SourceFileNode/model/types';
import type { SlideContext } from '../model/types';

export function getSlideFileNode(graphData: GraphData | null, filePath: string): SourceFileNode | null {
  if (!graphData?.nodes) return null;

  return graphData.nodes.find((node) => node.filePath === filePath && node.type === 'file') ?? null;
}

export function getSlideContextCodeLines(lines: CodeLine[], context: SlideContext): CodeLine[] {
  return lines.filter((line) => line.num >= context.startLine && line.num <= context.endLine);
}
