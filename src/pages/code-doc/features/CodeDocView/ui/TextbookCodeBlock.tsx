import type React from 'react';
import { useEffect, useRef, useState } from 'react';

interface HighlightJs {
  highlight: (code: string, options: { language: string }) => { value: string };
}

declare const hljs: HighlightJs | undefined;

const HighlightedCodeLine = ({ line, lang }: { line: string; lang: string }) => {
  const codeRef = useRef<HTMLElement>(null);
  const fallbackText = line || ' ';

  useEffect(() => {
    if (codeRef.current && typeof hljs !== 'undefined') {
      codeRef.current.innerHTML = hljs.highlight(fallbackText, { language: lang }).value;
    }
  }, [fallbackText, lang]);

  return (
    <code ref={codeRef} className={`language-${lang} bg-transparent p-0 block`}>
      {typeof hljs === 'undefined' ? fallbackText : undefined}
    </code>
  );
};

interface TextbookLineNumberProps {
  lineIndex: number;
  lineNumber: number;
  isHovered: boolean;
  canClick: boolean;
  onHoverLine: (lineIndex: number) => void;
  onLeaveLine: () => void;
  onLineClick: (lineNumber: number) => void;
}

function TextbookLineNumber({
  lineIndex,
  lineNumber,
  isHovered,
  canClick,
  onHoverLine,
  onLeaveLine,
  onLineClick,
}: TextbookLineNumberProps) {
  function handleMouseEnter() {
    onHoverLine(lineIndex);
  }

  function handleMouseLeave() {
    onLeaveLine();
  }

  function handleClick() {
    onLineClick(lineNumber);
  }

  return (
    <div
      className={`font-mono text-[10px] leading-5 transition-colors ${canClick ? 'cursor-pointer' : ''} ${
        isHovered ? 'text-blue-500 font-bold' : 'text-gray-300 group-hover:text-gray-400'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={canClick ? `Go to line ${lineNumber}` : undefined}
    >
      {lineNumber}
    </div>
  );
}

interface TextbookCodeRowProps {
  line: string;
  lang: string;
  lineIndex: number;
  lineNumber: number;
  isHovered: boolean;
  canClick: boolean;
  onHoverLine: (lineIndex: number) => void;
  onLeaveLine: () => void;
  onLineClick: (lineNumber: number) => void;
}

function TextbookCodeRow({
  line,
  lang,
  lineIndex,
  lineNumber,
  isHovered,
  canClick,
  onHoverLine,
  onLeaveLine,
  onLineClick,
}: TextbookCodeRowProps) {
  function handleMouseEnter() {
    onHoverLine(lineIndex);
  }

  function handleMouseLeave() {
    onLeaveLine();
  }

  function handleClick() {
    onLineClick(lineNumber);
  }

  return (
    <div
      className={`font-mono leading-5 text-gray-800 text-[11px] transition-colors ${canClick ? 'cursor-pointer' : ''} ${
        isHovered ? 'bg-blue-50/50' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <HighlightedCodeLine line={line} lang={lang} />
    </div>
  );
}

export const TextbookCodeBlock: React.FC<{
  code: string;
  lang?: string;
  startLine?: number;
  onLineClick?: (lineNumber: number) => void;
}> = ({ code, lang = 'typescript', startLine = 1, onLineClick }) => {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const lineCount = code.split('\n').length;
  const codeLines = code.split('\n');
  const canClickLine = Boolean(onLineClick);

  function handleHoverLine(lineIndex: number) {
    setHoveredLine(lineIndex);
  }

  function handleLeaveLine() {
    setHoveredLine(null);
  }

  function handleLineClick(lineNumber: number) {
    if (onLineClick) {
      onLineClick(lineNumber);
    }
  }

  return (
    <div className="my-4 bg-gray-50 rounded-md overflow-hidden group border border-gray-100/50">
      <div className="flex leading-5 py-2">
        <div className="flex-none w-8 text-right pr-2 select-none">
          {Array.from({ length: lineCount }, (_, i) => {
            const lineNum = startLine + i;
            const isHovered = hoveredLine === i;
            return (
              <TextbookLineNumber
                key={i}
                lineIndex={i}
                lineNumber={lineNum}
                isHovered={isHovered}
                canClick={canClickLine}
                onHoverLine={handleHoverLine}
                onLeaveLine={handleLeaveLine}
                onLineClick={handleLineClick}
              />
            );
          })}
        </div>

        <div className="flex-1 overflow-x-auto custom-scrollbar pl-3 pr-3">
          {codeLines.map((line, i) => {
            const isHovered = hoveredLine === i;
            return (
              <TextbookCodeRow
                key={i}
                line={line}
                lang={lang}
                lineIndex={i}
                lineNumber={startLine + i}
                isHovered={isHovered}
                canClick={canClickLine}
                onHoverLine={handleHoverLine}
                onLeaveLine={handleLeaveLine}
                onLineClick={handleLineClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
