import type React from 'react';

export interface ContentSearchPreviewInfo {
  filePath: string;
  fileName: string;
  content: string;
  matchLine?: number;
}

interface ContentSearchPreviewProps {
  previewInfo: ContentSearchPreviewInfo | null;
  previewRef: React.Ref<HTMLPreElement>;
}

export function ContentSearchPreview({ previewInfo, previewRef }: ContentSearchPreviewProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-bg-elevated">
      {previewInfo ? (
        <>
          <div className="flex items-center justify-between px-4 py-2 border-b border-border-DEFAULT flex-shrink-0">
            <span className="text-xs font-medium text-text-primary">{previewInfo.fileName}</span>
            <span className="text-2xs text-text-tertiary">{previewInfo.filePath}</span>
          </div>

          <pre
            ref={previewRef}
            className="flex-1 min-h-0 overflow-auto p-4 text-2xs font-mono text-text-secondary bg-bg-deep"
          >
            {previewInfo.content.split('\n').map((line, index) => {
              const lineNumber = index + 1;
              const isMatchLine = lineNumber === previewInfo.matchLine;

              return (
                <div key={lineNumber} data-line={lineNumber} className={`${isMatchLine ? 'bg-warm-300/10' : ''}`}>
                  <span className="inline-block w-12 text-right pr-4 text-text-tertiary select-none">{lineNumber}</span>
                  <span className={isMatchLine ? 'text-warm-300' : ''}>{line}</span>
                </div>
              );
            })}
          </pre>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-text-tertiary text-xs">
          Select a search result to preview
        </div>
      )}
    </div>
  );
}
