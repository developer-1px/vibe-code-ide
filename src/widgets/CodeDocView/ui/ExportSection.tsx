/**
 * ExportSection - export 선언을 GitHub 스타일로 렌더링
 */

import React from 'react';
import { Code, Type, Database, Box } from 'lucide-react';
import type { CodeDocSection } from '../lib/types';
import { extractCommentTag, getCommentTagInfo, removeTagFromContent } from '../lib/commentTagUtils';

interface ExportSectionProps {
  section: CodeDocSection;
}

interface ParsedSignature {
  name: string;
  params: string;
  returnType: string;
}

type ExportType = 'function' | 'interface' | 'type' | 'const' | 'variable';

/**
 * Export 타입 감지
 */
const detectExportType = (content: string): ExportType => {
  // interface Name
  if (content.startsWith('interface ')) return 'interface';

  // type Name
  if (content.startsWith('type ')) return 'type';

  // name(...) → returnType (function)
  if (content.includes('(') && content.includes('→')) return 'function';

  // name: type (const or variable)
  if (content.includes(':') && !content.includes('(')) {
    // UPPER_CASE → const, camelCase/PascalCase → variable
    const name = content.split(':')[0].trim();
    if (/^[A-Z_][A-Z0-9_]*$/.test(name)) return 'const';
    return 'variable';
  }

  return 'variable';
};

/**
 * Export 타입별 아이콘
 */
const getExportTypeIcon = (type: ExportType) => {
  switch (type) {
    case 'function':
      return Code;
    case 'interface':
    case 'type':
      return Type;
    case 'const':
      return Database;
    case 'variable':
      return Box;
  }
};

/**
 * Export 타입별 레이블
 */
const getExportTypeLabel = (type: ExportType): string => {
  switch (type) {
    case 'function':
      return 'FUNCTION';
    case 'interface':
      return 'INTERFACE';
    case 'type':
      return 'TYPE';
    case 'const':
      return 'CONST';
    case 'variable':
      return 'VARIABLE';
  }
};

/**
 * Signature 파싱: "functionName(params) → returnType"
 */
const parseSignature = (content: string): ParsedSignature | null => {
  const match = content.match(/^(.+?)\((.*?)\)\s*→\s*(.+)$/);
  if (!match) return null;

  return {
    name: match[1].trim(),
    params: match[2].trim(),
    returnType: match[3].trim()
  };
};

const ExportSection = ({ section }: ExportSectionProps) => {
  if (section.type !== 'export') return null;

  const { content, relatedComment } = section;
  const parsed = parseSignature(content);

  // Export 타입 및 메타 정보
  const exportType = detectExportType(content);
  const ExportIcon = getExportTypeIcon(exportType);
  const exportLabel = getExportTypeLabel(exportType);

  // 주석 태그 추출
  const commentTag = relatedComment ? extractCommentTag(relatedComment.content) : null;
  const commentTagInfo = commentTag ? getCommentTagInfo(commentTag) : null;
  const commentDisplayContent = relatedComment && commentTag
    ? removeTagFromContent(relatedComment.content, commentTag)
    : relatedComment?.content;

  // 파싱 실패 시 fallback (원본 텍스트)
  if (!parsed) {
    return (
      <section className="mb-24 pb-16 border-b border-gray-100 last:border-0 select-text">
        <div className="mb-8">
          <div className="mb-2">
            <span className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest">{exportLabel.toLowerCase()}</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 break-all leading-snug flex items-center gap-4">
            <div className="flex-none p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
              <ExportIcon className="w-6 h-6 stroke-1" />
            </div>
            <span>{content.split('(')[0].split(':')[0].trim()}</span>
          </h3>
          <div className="font-mono text-xs text-gray-500 mb-6 break-words bg-white border-l-2 border-gray-100 pl-3 py-1">
            {content}
          </div>
        </div>

        {/* Related comment (description) */}
        {relatedComment && (
          <div className="prose-textbook text-gray-800 text-lg leading-8 mb-10">
            {commentTagInfo && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${commentTagInfo.bgClass} border ${commentTagInfo.borderClass} rounded text-[10px] font-semibold ${commentTagInfo.colorClass} tracking-wide`}>
                {commentTagInfo.tag}
              </span>
            )}
            <p>{commentDisplayContent}</p>
          </div>
        )}
      </section>
    );
  }

  // Section 시작 스타일: 파싱된 signature (+ 관련 주석)
  return (
    <section className="mb-24 pb-16 border-b border-gray-100 last:border-0 select-text">
      <div className="mb-8">
        <div className="mb-2">
          <span className="font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest">{exportLabel.toLowerCase()}</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 break-all leading-snug flex items-center gap-4">
          <div className="flex-none p-2 bg-gray-50 rounded-lg border border-gray-100 text-gray-400">
            <ExportIcon className="w-6 h-6 stroke-1" />
          </div>
          <span>{parsed.name}</span>
        </h3>
        <div className="font-mono text-xs text-gray-500 mb-6 break-words bg-white border-l-2 border-gray-100 pl-3 py-1">
          {exportType === 'function' ? (
            <>
              function {parsed.name}({parsed.params}): {parsed.returnType}
            </>
          ) : (
            content
          )}
        </div>
      </div>

      {/* Related comment (description) */}
      {relatedComment && (
        <div className="prose-textbook text-gray-800 text-lg leading-8 mb-10">
          {commentTagInfo && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${commentTagInfo.bgClass} border ${commentTagInfo.borderClass} rounded text-[10px] font-semibold ${commentTagInfo.colorClass} tracking-wide`}>
              {commentTagInfo.tag}
            </span>
          )}
          <p>{commentDisplayContent}</p>
        </div>
      )}

      {/* Parameters & Returns (for functions) */}
      {exportType === 'function' && (
        <div className="mb-10 pt-6 border-t border-gray-100">
          {/* Parameters */}
          {parsed.params && (
            <div className="mb-6">
              <span className="block font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Inputs
              </span>
              <div className="text-sm">
                <div className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block">
                  {parsed.params}
                </div>
              </div>
            </div>
          )}

          {/* Returns */}
          <div className="mt-6">
            <span className="block font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Returns
            </span>
            <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block">
              {parsed.returnType}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExportSection;
