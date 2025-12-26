import { atom } from 'jotai';
import type { VariableNode } from '../entities/VariableNode';
import type { CanvasNode } from '../entities/CanvasNode';

// Canvas layout atoms (write-only from PipelineCanvas)
export const layoutNodesAtom = atom([] as CanvasNode[]);
export const fullNodeMapAtom = atom(new Map<string, VariableNode>());
export const entryFileAtom = atom('');
export const templateRootIdAtom = atom(null as string | null);

// Visibility and navigation atoms (read-write)
export const visibleNodeIdsAtom = atom(new Set<string>());
export const lastExpandedIdAtom = atom(null as string | null);
