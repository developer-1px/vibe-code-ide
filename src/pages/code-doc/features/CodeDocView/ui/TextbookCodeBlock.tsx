import type React from 'react';
import { useState } from 'react';
import { TextbookCodeRow } from './TextbookCodeRow';
import { TextbookLineNumber } from './TextbookLineNumber';

export const TextbookCodeBlock: React.FC<{
  code: string;
  lang?: string;
  startLine?: number;
  clickLine?: (lineNumber: number) => void;
}> = ({ code, lang = 'typescript', startLine = 1, clickLine }) => {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const lineCount = code.split('\n').length;
  const codeLines = code.split('\n');
  const canClickLine = Boolean(clickLine);

  function hoverLine(lineIndex: number) {
    setHoveredLine(lineIndex);
  }

  function leaveLine() {
    setHoveredLine(null);
  }

  function selectLine(lineNumber: number) {
    if (clickLine) {
      clickLine(lineNumber);
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
                hoverLine={hoverLine}
                leaveLine={leaveLine}
                clickLine={selectLine}
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
                hoverLine={hoverLine}
                leaveLine={leaveLine}
                clickLine={selectLine}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
