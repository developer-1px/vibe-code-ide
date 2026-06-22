import type { SourceFileNode } from '../../SourceFileNode/model/types';

export interface CanvasNode extends SourceFileNode {
  x: number;
  y: number;
  level: number; // 0 for Template, -1 for immediate deps, etc.
  isVisible: boolean;
  visualId: string; // Unique ID for the UI instance (since nodes can be duplicated)
}

export interface ComponentGroup {
  filePath: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  label: string;
}
