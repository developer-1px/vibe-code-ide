
import { useEffect, useState, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import { GraphData, VariableNode } from '../../entities/SourceFileNode';
import { CanvasNode } from '../../entities/CanvasNode';
import {
  layoutNodesAtom,
  layoutLinksAtom,
  fullNodeMapAtom,
} from '../../store/atoms';

export const useCanvasLayout = (
    initialData: GraphData | null,
    entryFile: string,
    visibleNodeIds: Set<string>
) => {
    const [layoutNodes, setLayoutNodes] = useState<CanvasNode[]>([]);
    const [layoutLinks, setLayoutLinks] = useState<{source: string, target: string}[]>([]);

    // Atom setters
    const setLayoutNodesAtom = useSetAtom(layoutNodesAtom);
    const setLayoutLinksAtom = useSetAtom(layoutLinksAtom);
    const setFullNodeMapAtom = useSetAtom(fullNodeMapAtom);

    const fullNodeMap = useMemo(() => {
        if (!initialData) return new Map<string, VariableNode>();
        const map = new Map<string, VariableNode>(initialData.nodes.map(n => [n.id, n]));
        return map;
    }, [initialData]);

    // --- Simple Layout: Just display visible nodes without auto-positioning ---
    useEffect(() => {
        if (fullNodeMap.size === 0) return;

        // Create canvas nodes for all visible nodes
        const canvasNodes: CanvasNode[] = [];
        const links: {source: string, target: string}[] = [];

        visibleNodeIds.forEach(nodeId => {
            const node = fullNodeMap.get(nodeId);
            if (node && node.codeSnippet && node.codeSnippet.trim() !== '') {
                canvasNodes.push({
                    ...node,
                    level: 0,
                    x: 0, // No auto-positioning, user will drag
                    y: 0,
                    isVisible: true,
                    visualId: nodeId,
                });

                // Create links based on dependencies
                // source = dependency (left), target = consumer (right)
                node.dependencies.forEach(depId => {
                    if (visibleNodeIds.has(depId)) {
                        links.push({ source: depId, target: nodeId });
                    }
                });
            }
        });

        setLayoutNodes(canvasNodes);
        setLayoutLinks(links);

    }, [visibleNodeIds, fullNodeMap]);

    // --- Sync atoms with layout data ---
    useEffect(() => {
        setLayoutNodesAtom(layoutNodes);
        setLayoutLinksAtom(layoutLinks);
        setFullNodeMapAtom(fullNodeMap);
    }, [layoutNodes, layoutLinks, fullNodeMap, setLayoutNodesAtom, setLayoutLinksAtom, setFullNodeMapAtom]);

    return {
        layoutNodes,
        layoutLinks,
        fullNodeMap,
    };
};
