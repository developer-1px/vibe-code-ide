import React, { useCallback, useEffect, useState } from 'react';
import { CanvasNode } from '../../entities/VariableNode';

interface CanvasConnectionsProps {
    layoutLinks: {source: string, target: string}[];
    layoutNodes: CanvasNode[];
    transform: { k: number, x: number, y: number };
    contentRef: React.RefObject<HTMLDivElement>;
}

const CanvasConnections: React.FC<CanvasConnectionsProps> = ({ layoutLinks, layoutNodes, transform, contentRef }) => {
    const [paths, setPaths] = useState<React.ReactElement[]>([]);

    const drawConnections = useCallback(() => {
        if (!contentRef.current || layoutNodes.length === 0) {
            setPaths([]);
            return;
        }
        
        const contentRect = contentRef.current.getBoundingClientRect();
        const newPaths: React.ReactElement[] = [];
    
        const getRelativePoint = (rect: DOMRect) => {
          return {
            x: (rect.left - contentRect.left) / transform.k,
            y: (rect.top - contentRect.top) / transform.k,
            w: rect.width / transform.k,
            h: rect.height / transform.k
          };
        };
    
        // Reset slots highlight
        document.querySelectorAll('[data-output-port], [data-token]').forEach(el => {
            el.classList.remove('ring-2', 'ring-vibe-accent', 'scale-125');
        });
    
        layoutLinks.forEach((link) => {
          // link.source = Dependency (Left Node)
          // link.target = Consumer (Right Node)
          const dependencyNode = layoutNodes.find(n => n.visualId === link.source);
          const consumerNode = layoutNodes.find(n => n.visualId === link.target);
          
          if (!dependencyNode || !consumerNode) return;
    
          const depEl = document.getElementById(`node-${dependencyNode.visualId}`);
          const consEl = document.getElementById(`node-${consumerNode.visualId}`);
          
          if (!depEl || !consEl) return;
    
          // 1. Start Point (Source/Left Node - Output)
          const outputPort = depEl.querySelector(`[data-output-port="${dependencyNode.id}"]`);
          let startX, startY;
    
          if (outputPort) {
              const portRect = outputPort.getBoundingClientRect();
              const portRel = getRelativePoint(portRect);
              startX = portRel.x + portRel.w;
              startY = portRel.y + (portRel.h / 2);
              outputPort.classList.add('ring-2', 'ring-vibe-accent', 'scale-125');
          } else {
              const defLine = depEl.querySelector(`[data-line-num="${dependencyNode.startLine}"]`);
              if (defLine) {
                  const rect = defLine.getBoundingClientRect();
                  const rel = getRelativePoint(rect);
                  startX = rel.x + rel.w;
                  startY = rel.y + (rel.h / 2);
              } else {
                  const rect = depEl.getBoundingClientRect();
                  const rel = getRelativePoint(rect);
                  startX = rel.x + rel.w;
                  startY = rel.y + 60;
              }
          }
    
          // 2. End Point (Target/Right Node - Input)
          const usageToken = consEl.querySelector(`[data-token="${dependencyNode.id}"]`);
          let endX, endY;
    
          if (usageToken) {
              const tokenRect = usageToken.getBoundingClientRect();
              const tokenRel = getRelativePoint(tokenRect);
              endX = tokenRel.x;
              endY = tokenRel.y + (tokenRel.h / 2);
              usageToken.classList.add('ring-2', 'ring-vibe-accent', 'scale-125');
          } else {
              const rect = consEl.getBoundingClientRect();
              const rel = getRelativePoint(rect);
              endX = rel.x;
              endY = rel.y + 60;
          }
    
          // 3. Draw Bezier
          const isHorizontal = Math.abs(startY - endY) < 40;
          const curveStrength = isHorizontal ? 0.15 : 0.4;
          const dist = Math.abs(endX - startX);
          const d = `M ${startX} ${startY} C ${startX + dist * curveStrength} ${startY}, ${endX - dist * curveStrength} ${endY}, ${endX} ${endY}`;
          const isCrossFile = consumerNode.filePath !== dependencyNode.filePath;
    
          newPaths.push(
            <path 
                key={`${link.source}-${link.target}`}
                d={d}
                fill="none"
                stroke={isCrossFile ? "#94a3b8" : "#38bdf8"}
                strokeWidth={isHorizontal ? "3" : "2"}
                strokeOpacity={isHorizontal ? "0.8" : "0.5"}
                strokeDasharray={isCrossFile ? "8,8" : "none"}
                className="transition-all duration-300 pointer-events-none"
                markerEnd="url(#arrowhead)"
            />
          );
        });
    
        setPaths(newPaths);
    
    }, [layoutLinks, transform.k, layoutNodes]);

    useEffect(() => {
        const handle = requestAnimationFrame(drawConnections);
        return () => cancelAnimationFrame(handle);
    }, [drawConnections, transform]);

    // Initial draw delay
    useEffect(() => {
        const t = setTimeout(drawConnections, 50); 
        return () => clearTimeout(t);
    }, [layoutNodes, drawConnections]);

    return (
        <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-50">
             <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" fillOpacity="0.5" />
                </marker>
            </defs>
            {paths}
        </svg>
    );
};

export default CanvasConnections;