/**
 * CodeDocFileSection - 파일별 CodeDoc 섹션 렌더링 (GitBook 스타일)
 */

import React, { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import type { SourceFileNode } from '../../../entities/SourceFileNode/model/types';
import { parseCodeDoc } from '../lib/parseCodeDoc';
import { getFileName } from '../../../shared/pathUtils';
import { getFileIcon } from '../../FileExplorer/lib/getFileIcon';
import CodeDocBreadcrumb from './CodeDocBreadcrumb';
import DependenciesSection from './DependenciesSection';
import CommentSection from './CommentSection';
import CodeSnippetSection from './CodeSnippetSection';
import ExportSection from './ExportSection';

interface CodeDocFileSectionProps {
  node: SourceFileNode;
}

const CodeDocFileSection = forwardRef<HTMLDivElement, CodeDocFileSectionProps>(({ node }, ref) => {
  const fileName = getFileName(node.filePath);
  const FileIconComponent = getFileIcon(fileName);

  // 섹션 파싱 (캐싱) - 한 번의 파싱으로 sections + imports 추출
  const { sections, imports } = useMemo(() => {
    return parseCodeDoc(node);
  }, [node]);

  // 파일 헤더 (파일 상단 주석) 추출
  const fileHeader = sections.find(s => s.type === 'fileHeader');

  // 메타데이터 계산
  const totalLines = node.codeSnippet.split('\n').length;
  const exportCount = sections.filter(s => s.type === 'export').length;
  const codeBlocks = sections.filter(s => s.type === 'code' || s.type === 'jsx').length;

  // Sticky 상태 감지
  const [isSticky, setIsSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 큰 헤더가 화면에서 사라지면 sticky bar 표시
        setIsSticky(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px'
      }
    );

    observer.observe(headerElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      id={`codedoc-section-${node.filePath}`}
      className="bg-white border border-gray-200 shadow-sm rounded-lg mb-8 overflow-hidden select-text"
    >
      {/* Sticky bar - sticky 상태일 때만 표시, full-width */}
      {isSticky && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2 shadow-sm">
          <FileIconComponent size={14} className="text-warm-400" />
          <span className="text-sm font-medium text-gray-900">{fileName}</span>
        </div>
      )}

      {/* Main content - compact document style */}
      <div className="px-8 py-6">
        {/* Breadcrumb navigation */}
        <div ref={headerRef}>
          <CodeDocBreadcrumb filePath={node.filePath} />
        </div>

        {/* File header - large, elegant */}
        <header className="mb-24 mt-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-8 tracking-tight leading-snug">
            {fileName}
          </h1>

          {/* File description (from file header comment) */}
          {fileHeader && (
            <div className="max-w-3xl font-serif text-xl md:text-2xl text-gray-600 leading-relaxed italic pl-6 border-l-4 border-gray-900 py-2 mb-10">
              {fileHeader.content}
            </div>
          )}

          {/* Metadata - horizontal layout */}
          <div className="flex flex-wrap gap-x-12 gap-y-6 font-sans text-xs text-gray-500 uppercase tracking-widest border-t border-gray-100 pt-6">
            <div>
              <span className="block text-[10px] text-gray-400 mb-1">Lines</span>
              <span className="text-gray-900 font-bold">{totalLines}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 mb-1">Exports</span>
              <span className="text-gray-900 font-bold">{exportCount}</span>
            </div>
            <div>
              <span className="block text-[10px] text-gray-400 mb-1">Code Blocks</span>
              <span className="text-gray-900 font-bold">{codeBlocks}</span>
            </div>
          </div>
        </header>

        {/* Dependencies section */}
        <DependenciesSection imports={imports} />

        {/* Divider */}
        <div className="border-t border-gray-200 my-8" />

        {/* Sections rendering */}
        <div>
          {sections.map((section, idx) => {
            // fileHeader는 이미 헤더에 표시되므로 건너뜀
            if (section.type === 'fileHeader') {
              return null;
            }

            // relatedComment로 사용되는 주석은 건너뜀 (다른 섹션에서 렌더링됨)
            if (section.type === 'comment') {
              // 이 주석이 다음 섹션의 relatedComment인지 확인
              const nextSection = sections[idx + 1];
              if (nextSection && nextSection.relatedComment === section) {
                return null; // 다음 섹션에서 렌더링됨
              }
              return <CommentSection key={idx} section={section} />;
            }

            if (section.type === 'export') {
              return <ExportSection key={idx} section={section} />;
            }

            return <CodeSnippetSection key={idx} section={section} />;
          })}
        </div>
      </div>
    </div>
  );
});

CodeDocFileSection.displayName = 'CodeDocFileSection';

export default CodeDocFileSection;
