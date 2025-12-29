import React, { useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { CanvasNode } from '../../../entities/CanvasNode';
import { CodeSegment } from '../../../entities/VariableNode/lib/renderCodeLines';
import CodeCardToken from './CodeCardToken';
import { fullNodeMapAtom, visibleNodeIdsAtom, entryFileAtom, templateRootIdAtom, lastExpandedIdAtom, targetLineAtom } from '../../../store/atoms';
import { pruneDetachedNodes } from '../../PipelineCanvas/utils';

const CodeCardLineSegment = ({segment,
  segIdx,
  node,
  isInReturnStatement
}: {
  segment: CodeSegment;
  segIdx: number;
  node: CanvasNode;
  isInReturnStatement: boolean;
}) => {
  const fullNodeMap = useAtomValue(fullNodeMapAtom);
  const setVisibleNodeIds = useSetAtom(visibleNodeIdsAtom);
  const entryFile = useAtomValue(entryFileAtom);
  const templateRootId = useAtomValue(templateRootIdAtom);
  const setLastExpandedId = useSetAtom(lastExpandedIdAtom);
  const setTargetLine = useSetAtom(targetLineAtom);

  const [showTooltip, setShowTooltip] = useState(false);

  const returnBgClass = isInReturnStatement ? 'bg-green-500/10 px-0.5 rounded' : '';

  const handleSelfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Close this node and prune orphaned dependencies
    setVisibleNodeIds((prev: Set<string>) => {
      const next = new Set(prev);
      next.delete(node.id);
      return pruneDetachedNodes(next, fullNodeMap, entryFile, templateRootId);
    });
  };

  const handleExternalRefClick = (e: React.MouseEvent, definedIn: string) => {
    e.stopPropagation();

    // 1. 해당 함수/변수 노드가 있으면 추가
    if (fullNodeMap.has(definedIn)) {
      setVisibleNodeIds((prev: Set<string>) => {
        const next = new Set(prev);
        next.add(definedIn);
        return next;
      });
      return;
    }

    // 2. 함수/변수 노드가 없으면 FILE_ROOT 노드 열기
    const filePath = definedIn.split('::')[0];
    const fileRootId = `${filePath}::FILE_ROOT`;

    if (fullNodeMap.has(fileRootId)) {
      setVisibleNodeIds((prev: Set<string>) => {
        const next = new Set(prev);
        next.add(fileRootId);
        return next;
      });
    }
  };

  // Plain text
  if (segment.kind === 'text') {
    return <span key={segIdx} className={`text-slate-300 select-text ${returnBgClass}`}>{segment.text}</span>;
  }

  // Keywords (export, function, const, return, etc.)
  if (segment.kind === 'keyword') {
    return <span key={segIdx} className={`text-purple-400 font-semibold select-text ${returnBgClass}`}>{segment.text}</span>;
  }

  // Punctuation ({}, (), [], =>, :, ;, etc.)
  if (segment.kind === 'punctuation') {
    return <span key={segIdx} className={`text-slate-400 select-text ${returnBgClass}`}>{segment.text}</span>;
  }

  // Strings
  if (segment.kind === 'string') {
    return <span key={segIdx} className={`text-orange-300 select-text ${returnBgClass}`}>{segment.text}</span>;
  }

  // Comments
  if (segment.kind === 'comment') {
    return <span key={segIdx} className="text-slate-500 italic opacity-80 select-text">{segment.text}</span>;
  }

  // Self reference (node definition)
  if (segment.kind === 'self') {
    // Declaration name에 약한 glow 효과 (vibe-accent 색상 사용)
    const glowClass = segment.isDeclarationName
      ? 'shadow-[0_0_6px_rgba(139,92,246,0.4)] bg-vibe-accent/15'
      : 'bg-vibe-accent/10';

    // 접혀있는 코드(모듈)에서 선언 이름을 클릭하면 해당 정의로 이동
    const hasDefinitionNode = segment.isDeclarationName && segment.nodeId && fullNodeMap.has(segment.nodeId);

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasDefinitionNode && segment.nodeId) {
        // 접힌 코드의 선언 이름 → 정의 노드 열기
        setVisibleNodeIds((prev: Set<string>) => {
          const next = new Set(prev);
          next.add(segment.nodeId!);
          return next;
        });
      } else {
        // 일반 self reference → 카드 닫기
        handleSelfClick(e);
      }
    };

    const hoverClass = hasDefinitionNode
      ? 'hover:bg-vibe-accent/25 hover:text-vibe-accent'
      : 'hover:bg-red-500/20 hover:text-red-400 hover:line-through';

    return (
      <span
        key={segIdx}
        onClick={handleClick}
        title={
          hasDefinitionNode
            ? `Click to show definition: ${segment.nodeId}`
            : segment.isDeclarationName
            ? "Declaration name (click to close)"
            : "Click to close this card"
        }
        className={`inline-block px-0.5 rounded ${glowClass} text-vibe-accent font-bold cursor-pointer ${hoverClass} transition-colors select-text`}
      >
        {segment.text}
      </span>
    );
  }

  // External Import Dependency
  if (segment.kind === 'external-import') {
    const hasDefinedIn = !!segment.definedIn;
    const hasNode = segment.definedIn && fullNodeMap.has(segment.definedIn);
    const filePath = segment.definedIn?.split('::')[0];
    const hasFileRoot = filePath && fullNodeMap.has(`${filePath}::FILE_ROOT`);

    return (
      <span
        key={segIdx}
        onClick={hasDefinedIn ? (e) => handleExternalRefClick(e, segment.definedIn!) : undefined}
        className={`text-emerald-400 font-semibold underline decoration-dotted decoration-emerald-400/40 hover:bg-emerald-400/10 px-0.5 rounded transition-all select-text ${hasDefinedIn ? 'cursor-pointer' : ''}`}
        title={
          hasNode
            ? `Click to show: ${segment.definedIn}`
            : hasFileRoot
            ? `Click to show module: ${filePath}::FILE_ROOT`
            : hasDefinedIn
            ? `Click to add: ${segment.definedIn}`
            : `External Import: ${segment.text}`
        }
      >
        {segment.text}
      </span>
    );
  }

  // External Closure Dependency (non-function variables)
  if (segment.kind === 'external-closure') {
    const hasDefinedIn = !!segment.definedIn;
    const hasNode = segment.definedIn && fullNodeMap.has(segment.definedIn);
    const filePath = segment.definedIn?.split('::')[0];
    const hasFileRoot = filePath && fullNodeMap.has(`${filePath}::FILE_ROOT`);

    return (
      <span
        key={segIdx}
        onClick={hasDefinedIn ? (e) => handleExternalRefClick(e, segment.definedIn!) : undefined}
        className={`text-amber-400 font-semibold underline decoration-dotted decoration-amber-400/40 hover:bg-amber-400/10 px-0.5 rounded transition-all select-text ${hasDefinedIn ? 'cursor-pointer' : ''}`}
        title={
          hasNode
            ? `Click to show: ${segment.definedIn}`
            : hasFileRoot
            ? `Click to show module: ${filePath}::FILE_ROOT`
            : hasDefinedIn
            ? `Click to add: ${segment.definedIn}`
            : `Closure Variable: ${segment.text}`
        }
      >
        {segment.text}
      </span>
    );
  }

  // External Function Variable (file-level function variables)
  if (segment.kind === 'external-function') {
    const hasDefinedIn = !!segment.definedIn;
    const hasNode = segment.definedIn && fullNodeMap.has(segment.definedIn);
    const filePath = segment.definedIn?.split('::')[0];
    const hasFileRoot = filePath && fullNodeMap.has(`${filePath}::FILE_ROOT`);

    return (
      <span
        key={segIdx}
        onClick={hasDefinedIn ? (e) => handleExternalRefClick(e, segment.definedIn!) : undefined}
        className={`text-purple-400 font-semibold underline decoration-dotted decoration-purple-400/40 hover:bg-purple-400/10 px-0.5 rounded transition-all select-text ${hasDefinedIn ? 'cursor-pointer' : ''}`}
        title={
          hasNode
            ? `Click to show: ${segment.definedIn}`
            : hasFileRoot
            ? `Click to show module: ${filePath}::FILE_ROOT`
            : hasDefinedIn
            ? `Click to add: ${segment.definedIn}`
            : `Function Variable: ${segment.text}`
        }
      >
        {segment.text}
      </span>
    );
  }

  // Parameter
  if (segment.kind === 'parameter') {
    return (
      <span
        key={segIdx}
        className="text-violet-300 font-normal select-text"
        title={`Parameter: ${segment.text}`}
      >
        {segment.text}
      </span>
    );
  }

  // Local Variable
  if (segment.kind === 'local-variable') {
    return (
      <span
        key={segIdx}
        className="text-cyan-300 font-normal select-text"
        title={`Local Variable: ${segment.text}`}
      >
        {segment.text}
      </span>
    );
  }

  // Regular identifier (dependency)
  if (segment.kind === 'identifier' && segment.nodeId) {
    return (
      <span key={segIdx} className={`select-text ${returnBgClass}`}>
        <CodeCardToken
          text={segment.text}
          tokenId={segment.nodeId}
          nodeId={node.id}
        />
      </span>
    );
  }

  // Identifier with Language Service data (hover tooltip or go-to-definition)
  if (
    segment.kind === 'identifier' &&
    !segment.nodeId &&
    (segment.hoverInfo || segment.definitionLocation)
  ) {
    const hasDefinition = !!segment.definitionLocation;

    const handleDefinitionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!segment.definitionLocation) return;

      const { filePath, line } = segment.definitionLocation;

      console.log('[Go to Definition]', { filePath, line });

      // Find all nodes from the target file
      const nodesInFile = Array.from(fullNodeMap.values()).filter(
        n => n.filePath === filePath
      );

      // Find the node that contains this line
      // Priority: 1) Exact startLine match, 2) Line within node range, 3) FILE_ROOT fallback
      let targetNode = nodesInFile.find(n => n.startLine === line);

      if (!targetNode) {
        targetNode = nodesInFile.find(
          n =>
            n.startLine !== undefined &&
            n.endLine !== undefined &&
            line >= n.startLine &&
            line <= n.endLine
        );
      }

      if (!targetNode) {
        // Fallback: open FILE_ROOT node
        const fileRootId = `${filePath}::FILE_ROOT`;
        targetNode = fullNodeMap.get(fileRootId);
      }

      if (!targetNode) {
        console.warn('[Go to Definition] No node found for', { filePath, line });
        alert(`Could not find node for ${filePath}:${line}`);
        return;
      }

      // Open the target node and center camera
      setVisibleNodeIds((prev: Set<string>) => {
        const next = new Set(prev);
        next.add(targetNode!.id);
        return next;
      });

      setLastExpandedId(targetNode.id);

      // Set target line for highlighting
      setTargetLine({ nodeId: targetNode.id, lineNum: line });

      // Clear target line after 2 seconds
      setTimeout(() => {
        setTargetLine(null);
      }, 2000);
    };

    return (
      <span
        key={segIdx}
        onClick={hasDefinition ? handleDefinitionClick : undefined}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative inline-block px-0.5 rounded transition-colors select-text ${
          hasDefinition
            ? 'text-sky-300 underline decoration-dotted decoration-sky-300/40 cursor-pointer hover:bg-sky-400/15'
            : 'text-slate-300'
        } ${returnBgClass}`}
        title={segment.hoverInfo || undefined}
      >
        {segment.text}

        {/* Hover Tooltip */}
        {showTooltip && segment.hoverInfo && (
          <div className="absolute bottom-full left-0 mb-1 z-50 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200 whitespace-pre-wrap max-w-md shadow-lg pointer-events-none">
            <code className="font-mono text-[10px]">{segment.hoverInfo}</code>
          </div>
        )}
      </span>
    );
  }

  return null;
};

export default CodeCardLineSegment;
