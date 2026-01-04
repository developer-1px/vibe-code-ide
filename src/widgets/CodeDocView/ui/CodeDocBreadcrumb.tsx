/**
 * CodeDocBreadcrumb - Breadcrumb navigation from file path
 * 파일 경로 기반 Breadcrumb 네비게이션 (GitBook 스타일)
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface CodeDocBreadcrumbProps {
  filePath: string;
}

const CodeDocBreadcrumb = ({ filePath }: CodeDocBreadcrumbProps) => {
  // Split path into segments
  // e.g., "src/widgets/CodeDocView/ui/CommentSection.tsx" → ["src", "widgets", "CodeDocView", "ui", "CommentSection.tsx"]
  const segments = filePath.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-[11px] font-sans font-medium text-gray-400 uppercase tracking-wider mb-8">
      {/* Home icon + label */}
      <div className="flex items-center gap-1 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
        <Home className="w-3 h-3" />
        <span>Home</span>
      </div>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <React.Fragment key={index}>
            {/* Separator */}
            <ChevronRight className="w-3 h-3 text-gray-300" />

            {/* Segment */}
            <span
              className={
                isLast
                  ? 'text-gray-900 font-bold'
                  : 'hover:text-gray-600 cursor-pointer transition-colors'
              }
            >
              {segment}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default CodeDocBreadcrumb;
