
import React from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { CanvasNode } from '../../../CanvasNode';
import { ProcessedLine } from '../../lib/types.ts';
import CodeCardSlot from './CodeCardSlot.tsx';
import CodeCardToken from './CodeCardToken.tsx';
import { fullNodeMapAtom, visibleNodeIdsAtom, entryFileAtom, templateRootIdAtom } from '../../../../store/atoms';
import { pruneDetachedNodes } from '../../../../widgets/PipelineCanvas/utils.ts';

interface CodeCardLineProps {
  line: ProcessedLine;
  node: CanvasNode;
  isDefinitionLine: boolean;
}

const CodeCardLine: React.FC<CodeCardLineProps> = ({
  line,
  node,
  isDefinitionLine
}) => {
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const setVisibleNodeIds = useSetAtom(visibleNodeIdsAtom);
  const entryFile = useAtomValue(entryFileAtom);
  const templateRootId = useAtomValue(templateRootIdAtom);
  const isTemplate = node.type === 'template';

  const handleSelfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Close this node and prune orphaned dependencies
    setVisibleNodeIds((prev: Set<string>) => {
      const next = new Set(prev);
      next.delete(node.id);
      return pruneDetachedNodes(next, fullNodeMap, entryFile, templateRootId);
    });
  };

  return (
    <div
      className={`
        flex w-full group/line relative
        ${isDefinitionLine && !isTemplate ? 'bg-vibe-accent/5' : ''}
      `}
      data-line-num={line.num}
    >
      {/* Line Number Column: Aligned text-right, fixed leading/padding to match code */}
      {/* Reduced padding from pr-3 to pr-2 to allow more space for internal slots */}
      <div className="flex-none w-12 pr-2 text-right select-none text-xs font-mono text-slate-600 border-r border-white/5 bg-[#0f172a]/50 leading-5 py-0.5">
        <div className="relative inline-block w-full">
          {/* Render input slots for each token in this line */}
          {/* Note: We exclude 'import-source' from dots/slots in the gutter, as we want the line to connect to the text itself */}
          {line.segments.filter(seg => seg.type === 'token' && seg.tokenId).map((seg, slotIdx) => {
            const depNode = fullNodeMap.get(seg.tokenId!);

            return (
              <CodeCardSlot
                key={`slot-${slotIdx}`}
                tokenId={seg.tokenId!}
                lineNum={line.num}
                slotIdx={slotIdx}
                depNode={depNode}
              />
            );
          })}

          <span className={isDefinitionLine && !isTemplate ? 'text-vibe-accent font-bold' : ''}>
            {line.num}
          </span>
        </div>
      </div>

      {/* Code Content Column: leading-5 (20px) + py-0.5 (2px) = 24px total height per line */}
      <div className="flex-1 px-3 py-0.5 font-mono text-xs leading-5 overflow-x-auto whitespace-pre-wrap break-words">
        {line.segments.map((segment, segIdx) => {
          if (segment.type === 'text') {
            return <span key={segIdx} className="text-slate-300">{segment.text}</span>;
          }

          if (segment.type === 'self') {
            // Self token: Definition of the current node.
            // Now clickable to close/hide the node (UX improvement).
            return (
              <span
                key={segIdx}
                onClick={handleSelfClick}
                title="Click to close this card"
                className="inline-block px-0.5 rounded bg-vibe-accent/10 text-vibe-accent font-bold cursor-pointer hover:bg-red-500/20 hover:text-red-400 hover:line-through transition-colors"
              >
                {segment.text}
              </span>
            );
          }

          if (segment.type === 'primitive') {
             return (
               <span key={segIdx} className="text-[#38bdf8] font-medium">
                 {segment.text}
               </span>
             );
          }

          if (segment.type === 'string') {
             return (
               <span key={segIdx} className="text-orange-300">
                 {segment.text}
               </span>
             );
          }

          if (segment.type === 'comment') {
             return (
               <span key={segIdx} className="text-slate-500 italic opacity-80">
                 {segment.text}
               </span>
             );
          }

          if (segment.type === 'import-source' && segment.tokenId) {
             return (
               <span 
                 key={segIdx} 
                 className="text-orange-300 underline decoration-dashed decoration-white/20 hover:decoration-orange-300 cursor-crosshair transition-all bg-white/5 px-1 rounded mx-0.5"
                 data-input-slot-for={segment.tokenId}
                 title={`Import source for: ${segment.tokenId}`}
               >
                 {segment.text}
               </span>
             );
          }

          if (segment.type === 'token' && segment.tokenId) {
            return (
              <CodeCardToken
                key={segIdx}
                text={segment.text}
                tokenId={segment.tokenId}
                nodeId={node.id}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Output Port (Definition Line): Centered vertically relative to the first line (12px top) */}
      {isDefinitionLine && !isTemplate && (
        <div
          className="absolute right-0 top-3 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-500 translate-x-[50%] ring-2 ring-vibe-panel"
          data-output-port={node.id}
        />
      )}
    </div>
  );
};

export default CodeCardLine;
