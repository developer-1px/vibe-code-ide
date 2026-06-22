import { HighlightedCodeLine } from './HighlightedCodeLine';

interface TextbookCodeRowProps {
  line: string;
  lang: string;
  lineIndex: number;
  lineNumber: number;
  isHovered: boolean;
  canClick: boolean;
  hoverLine: (lineIndex: number) => void;
  leaveLine: () => void;
  clickLine: (lineNumber: number) => void;
}

export function TextbookCodeRow({
  line,
  lang,
  lineIndex,
  lineNumber,
  isHovered,
  canClick,
  hoverLine,
  leaveLine,
  clickLine,
}: TextbookCodeRowProps) {
  function handleMouseEnter() {
    hoverLine(lineIndex);
  }

  function handleMouseLeave() {
    leaveLine();
  }

  function handleClick() {
    clickLine(lineNumber);
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
