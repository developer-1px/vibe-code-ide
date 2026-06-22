import type React from 'react';
import { useState } from 'react';
import { TextbookCodeRow } from './TextbookCodeRow';
import { TextbookLineNumber } from './TextbookLineNumber';

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
                hoverLine={handleHoverLine}
                leaveLine={handleLeaveLine}
                clickLine={handleLineClick}
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
                hoverLine={handleHoverLine}
                leaveLine={handleLeaveLine}
                clickLine={handleLineClick}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
