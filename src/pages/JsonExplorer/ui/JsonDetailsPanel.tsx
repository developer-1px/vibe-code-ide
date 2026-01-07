/**
 * JsonDetailsPanel - 선택한 행의 상세 정보 표시 (JSON Syntax Highlighting)
 */

import { Copy, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface JsonDetailsPanelProps {
  data: Record<string, unknown> | null;
  onClose: () => void;
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

  const handleCopyPath = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy path:', error);
    }
  };

  return (
    <div className="font-mono text-2xs">
      {lines.map((line, index) => {
        // Syntax highlighting
        const highlightedText = line.text
          // 키 (property name)
          .replace(/"([^"]+)":/g, '<span class="text-warm-300 font-semibold">"$1"</span>:')
          // 문자열 값
          .replace(/:\s*"([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
          // 숫자
          .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-blue-400">$1</span>')
          // true/false
          .replace(/:\s*(true|false)/g, ': <span class="text-purple-400">$1</span>')
          // null
          .replace(/:\s*(null)/g, ': <span class="text-text-tertiary italic">$1</span>')
          // 괄호
          .replace(/([{}[\]])/g, '<span class="text-text-secondary">$1</span>');

        return (
          <div key={index} className="group hover:bg-warm-500/5 relative flex items-center">
            {/* Line number */}
            <span className="text-text-tertiary select-none pr-3 pl-2 text-right" style={{ minWidth: '3rem' }}>
              {line.lineNumber}
            </span>

            {/* Code */}
            <div
              className="flex-1 whitespace-pre"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />

            {/* Copy path button */}
            {line.path && (
              <button
                onClick={(e) => handleCopyPath(line.path!, e)}
                className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-bg-elevated rounded"
                title={`Copy path: ${line.path}`}
                aria-label="Copy path"
              >
                <Copy size={10} className={copiedPath === line.path ? 'text-green-400' : 'text-text-tertiary'} />
              </button>
            )}
          </div>
        );
      })}
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

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!data) {
    return (
      <div className="w-96 border-l border-border-DEFAULT bg-bg-elevated flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-DEFAULT bg-bg-deep">
          <h2 className="text-xs font-semibold text-text-primary">Details</h2>
          <button
            onClick={onClose}
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
            onClick={onClose}
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
