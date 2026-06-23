import { getFileName } from '@/shared/pathUtils';
import type { CanvasNode } from '../model/types';

export function getCanvasNodeDisplayLabel(node: CanvasNode): string {
  const nodeType: string = node.type;

  if (nodeType === 'module' && node.filePath) {
    const fileName = getFileName(node.filePath);
    return fileName || node.label;
  }

  return node.label;
}

export function getCanvasNodeTypeLabel(node: CanvasNode): string {
  const nodeType: string = node.type;
  const isTemplateComponent =
    nodeType === 'template' &&
    node.id.includes('::') &&
    !node.id.endsWith('::TEMPLATE_ROOT') &&
    !node.id.endsWith('::JSX_ROOT') &&
    !node.id.endsWith('::FILE_ROOT');

  return isTemplateComponent ? 'component' : nodeType;
}

export function getCanvasNodeShortPath(node: CanvasNode): string {
  if (!node.filePath) return '';

  return node.filePath.replace('src/', '');
}
