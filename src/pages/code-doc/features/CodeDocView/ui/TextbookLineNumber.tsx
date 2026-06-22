interface TextbookLineNumberProps {
  lineIndex: number;
  lineNumber: number;
  isHovered: boolean;
  canClick: boolean;
  hoverLine: (lineIndex: number) => void;
  leaveLine: () => void;
  clickLine: (lineNumber: number) => void;
}

export function TextbookLineNumber({
  lineIndex,
  lineNumber,
  isHovered,
  canClick,
  hoverLine,
  leaveLine,
  clickLine,
}: TextbookLineNumberProps) {
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
