/**
 * JsonDetailsPanel - 선택한 행의 상세 정보 표시 (JSON Syntax Highlighting)
 */

import { Copy, X } from 'lucide-react';
import type React from 'react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/shared/ui/ScrollArea';

interface JsonDetailsPanelProps {
  data: Record<string, unknown> | null;
  onClose: () => void;
}

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
  onCopyPath: (path: string, e: React.MouseEvent) => void;
}

function JsonHighlighterLine({ line, copiedPath, onCopyPath }: JsonHighlighterLineProps) {
  function handleCopyPathClick(e: React.MouseEvent) {
    if (line.path) {
      onCopyPath(line.path, e);
    }
  }

  return (
    <div className="group hover:bg-warm-500/5 relative flex items-center">
      {/* Line number */}
      <span className="text-text-tertiary select-none pr-3 pl-2 text-right" style={{ minWidth: '3rem' }}>
        {line.lineNumber}
      </span>

      {/* Code */}
      <div className="flex-1 whitespace-pre">{renderHighlightedJsonLine(line.text)}</div>

      {/* Copy path button */}
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

/**
 * JSON 문자열에 syntax highlighting 적용
 */
function JsonHighlighter({ json }: { json: string }) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // JSON을 줄 단위로 파싱하여 각 키의 경로 추출
  const lines = useMemo(() => {
    const jsonLines = json.split('\n');
    const result: Array<{ text: string; path: string | null; lineNumber: number }> = [];
    const pathStack: string[] = [];
    let inString = false;
    let currentKey = '';

    jsonLines.forEach((line, index) => {
      const trimmed = line.trim();

      // 문자열 내부 체크
      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === '"' && (i === 0 || trimmed[i - 1] !== '\\')) {
          inString = !inString;
        }
      }

      // 키 추출 (예: "name": → name)
      const keyMatch = trimmed.match(/^"([^"]+)":/);
      if (keyMatch && !inString) {
        currentKey = keyMatch[1];
      }

      // 경로 계산
      let currentPath: string | null = null;
      if (currentKey && pathStack.length > 0) {
        currentPath = [...pathStack, currentKey].join('.');
      } else if (currentKey) {
        currentPath = currentKey;
      }

      // { 또는 [ 만났을 때 스택에 추가
      if ((trimmed.includes('{') || trimmed.includes('[')) && currentKey && !inString) {
        pathStack.push(currentKey);
        currentKey = '';
      }

      // } 또는 ] 만났을 때 스택에서 제거
      if ((trimmed === '}' || trimmed === '},' || trimmed === ']' || trimmed === '],') && !inString) {
        pathStack.pop();
      }

      result.push({
        text: line,
        path: currentPath,
        lineNumber: index + 1,
      });

      // 키 리셋 (콤마 후)
      if (trimmed.endsWith(',') && !trimmed.endsWith('},') && !trimmed.endsWith('],')) {
        currentKey = '';
      }
    });

    return result;
  }, [json]);

  async function handleCopyPath(path: string, e: React.MouseEvent) {
    e.stopPropagation();
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
        <JsonHighlighterLine key={line.lineNumber} line={line} copiedPath={copiedPath} onCopyPath={handleCopyPath} />
      ))}
    </div>
  );
}

export function JsonDetailsPanel({ data, onClose }: JsonDetailsPanelProps) {
  const [copied, setCopied] = useState(false);

  // JSON 문자열 생성 (pretty print)
  const jsonString = useMemo(() => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  }, [data]);

  async function handleCopy() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function handleCloseClick() {
    onClose();
  }

  if (!data) {
    return (
      <div className="w-96 border-l border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep">
          <h2 className="text-xs font-semibold text-text-primary">Details</h2>
          <button
            onClick={handleCloseClick}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Close panel"
          >
            <X size={14} className="text-text-tertiary" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-2xs text-text-tertiary">Select a row to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[480px] border-l border-border-DEFAULT bg-bg-deep flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep shrink-0">
        <h2 className="text-xs font-semibold text-text-primary">Row Details (JSON)</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Copy JSON"
            title="Copy JSON"
          >
            <Copy size={14} className={copied ? 'text-green-400' : 'text-text-tertiary'} />
          </button>
          <button
            onClick={handleCloseClick}
            className="p-1 hover:bg-bg-elevated rounded transition-colors"
            aria-label="Close panel"
          >
            <X size={14} className="text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* JSON with Syntax Highlighting */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          <JsonHighlighter json={jsonString} />
        </div>
      </ScrollArea>
    </div>
  );
}
