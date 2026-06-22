import { Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

function renderHighlightedJsonLine(text: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  const tokenPattern =
    /"([^"\\]*(?:\\.[^"\\]*)*)"(?=\s*:)|(:\s*)"([^"\\]*(?:\\.[^"\\]*)*)"|(:\s*)(-?\d+(?:\.\d+)?)|(:\s*)(true|false)|(:\s*)(null)|([{}[\]])/g;
  let lastIndex = 0;

  Array.from(text.matchAll(tokenPattern)).forEach((match, index) => {
    if (match.index === undefined) return;

    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const key = `${index}-${match.index}`;

    if (match[1] !== undefined) {
      tokens.push(
        <span key={key} className="text-warm-300 font-semibold">
          {match[0]}
        </span>
      );
    } else if (match[3] !== undefined) {
      tokens.push(match[2]);
      tokens.push(
        <span key={key} className="text-green-400">
          "{match[3]}"
        </span>
      );
    } else if (match[5] !== undefined) {
      tokens.push(match[4]);
      tokens.push(
        <span key={key} className="text-blue-400">
          {match[5]}
        </span>
      );
    } else if (match[7] !== undefined) {
      tokens.push(match[6]);
      tokens.push(
        <span key={key} className="text-purple-400">
          {match[7]}
        </span>
      );
    } else if (match[9] !== undefined) {
      tokens.push(match[8]);
      tokens.push(
        <span key={key} className="text-text-tertiary italic">
          {match[9]}
        </span>
      );
    } else if (match[10] !== undefined) {
      tokens.push(
        <span key={key} className="text-text-secondary">
          {match[10]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  });

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

interface JsonHighlighterLineProps {
  line: { text: string; path: string | null; lineNumber: number };
  copiedPath: string | null;
  copyPath: (path: string) => void;
}

function JsonHighlighterLine({ line, copiedPath, copyPath }: JsonHighlighterLineProps) {
  function handleCopyPathClick(e: React.MouseEvent) {
    if (line.path) {
      e.stopPropagation();
      copyPath(line.path);
    }
  }

  return (
    <div className="group hover:bg-warm-500/5 relative flex items-center">
      <span className="text-text-tertiary select-none pr-3 pl-2 text-right" style={{ minWidth: '3rem' }}>
        {line.lineNumber}
      </span>

      <div className="flex-1 whitespace-pre">{renderHighlightedJsonLine(line.text)}</div>

      {line.path && (
        <button
          onClick={handleCopyPathClick}
          className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-bg-elevated rounded"
          title={`Copy path: ${line.path}`}
          aria-label="Copy path"
        >
          <Copy size={10} className={copiedPath === line.path ? 'text-green-400' : 'text-text-tertiary'} />
        </button>
      )}
    </div>
  );
}

export function JsonHighlighter({ json }: { json: string }) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const lines = useMemo(() => {
    const jsonLines = json.split('\n');
    const result: Array<{ text: string; path: string | null; lineNumber: number }> = [];
    const pathStack: string[] = [];
    let inString = false;
    let currentKey = '';

    jsonLines.forEach((line, index) => {
      const trimmed = line.trim();

      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === '"' && (i === 0 || trimmed[i - 1] !== '\\')) {
          inString = !inString;
        }
      }

      const keyMatch = trimmed.match(/^"([^"]+)":/);
      if (keyMatch && !inString) {
        currentKey = keyMatch[1];
      }

      let currentPath: string | null = null;
      if (currentKey && pathStack.length > 0) {
        currentPath = [...pathStack, currentKey].join('.');
      } else if (currentKey) {
        currentPath = currentKey;
      }

      if ((trimmed.includes('{') || trimmed.includes('[')) && currentKey && !inString) {
        pathStack.push(currentKey);
        currentKey = '';
      }

      if ((trimmed === '}' || trimmed === '},' || trimmed === ']' || trimmed === '],') && !inString) {
        pathStack.pop();
      }

      result.push({
        text: line,
        path: currentPath,
        lineNumber: index + 1,
      });

      if (trimmed.endsWith(',') && !trimmed.endsWith('},') && !trimmed.endsWith('],')) {
        currentKey = '';
      }
    });

    return result;
  }, [json]);

  async function copyPath(path: string) {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  }

  return (
    <div className="font-mono text-2xs">
      {lines.map((line) => (
        <JsonHighlighterLine key={line.lineNumber} line={line} copiedPath={copiedPath} copyPath={copyPath} />
      ))}
    </div>
  );
}
