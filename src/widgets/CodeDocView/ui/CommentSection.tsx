/**
 * CommentSection - 주석을 문서 본문처럼 렌더링
 */

import React from 'react';
import type { CodeDocSection } from '../lib/types';
import { extractCommentTag, getCommentTagInfo, removeTagFromContent } from '../lib/commentTagUtils';

interface CommentSectionProps {
  section: CodeDocSection;
}

const CommentSection = ({ section }: CommentSectionProps) => {
  if (section.type !== 'comment') return null;

  const { depth = 0, commentStyle, headingText, content } = section;

  // 주석 태그 추출 (TODO, FIXME, NOTE 등)
  const tag = extractCommentTag(content);
  const tagInfo = tag ? getCommentTagInfo(tag) : null;
  const displayContent = tag ? removeTagFromContent(content, tag) : content;

  // Separator 스타일: 구분선 + 큰 제목
  if (commentStyle === 'separator' && headingText) {
    return (
      <div className="mt-12 mb-8 select-text">
        <div className="border-t border-gray-300 mb-4" />
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-4 select-text">
          {headingText}
        </h1>
        <div className="border-t border-gray-300 mt-4" />
      </div>
    );
  }

  // JSDoc 스타일: 연한 배경 패널 (위: 큰 간격, 아래: 작은 간격)
  if (commentStyle === 'jsdoc') {
    return (
      <div className="mt-10 mb-3 px-4 py-2 bg-warm-50 border-l-2 border-warm-400 rounded-r select-text">
        {tagInfo && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${tagInfo.bgClass} border ${tagInfo.borderClass} rounded text-[10px] font-semibold ${tagInfo.colorClass} tracking-wide`}>
            {tagInfo.tag}
          </span>
        )}
        <div className="text-lg leading-8 text-gray-700 whitespace-pre-wrap select-text">{displayContent}</div>
      </div>
    );
  }

  // XML Doc 스타일: 파란 테두리 강조 (위: 큰 간격, 아래: 작은 간격)
  if (commentStyle === 'xml') {
    return (
      <div className="mt-10 mb-3 px-4 py-2 bg-blue-50 border-l-2 border-blue-400 rounded-r select-text">
        {tagInfo && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${tagInfo.bgClass} border ${tagInfo.borderClass} rounded text-[10px] font-semibold ${tagInfo.colorClass} tracking-wide`}>
            {tagInfo.tag}
          </span>
        )}
        <div className="text-lg leading-8 text-gray-700 whitespace-pre-wrap select-text">{displayContent}</div>
      </div>
    );
  }

  // Depth에 따른 제목 스타일 (compact)
  if (depth === 0) {
    // h1 스타일 (최상위)
    return (
      <div className="mt-8 mb-3 select-text">
        {tagInfo && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${tagInfo.bgClass} border ${tagInfo.borderClass} rounded text-[10px] font-semibold ${tagInfo.colorClass} tracking-wide`}>
            {tagInfo.tag}
          </span>
        )}
        <h1 className="text-3xl font-serif font-bold text-gray-900 leading-snug whitespace-pre-wrap select-text">{displayContent}</h1>
      </div>
    );
  }

  if (depth === 1) {
    // h2 스타일 (블록 내부)
    return (
      <div className="mt-6 mb-2 select-text">
        {tagInfo && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${tagInfo.bgClass} border ${tagInfo.borderClass} rounded text-[10px] font-semibold ${tagInfo.colorClass} tracking-wide`}>
            {tagInfo.tag}
          </span>
        )}
        <h2 className="text-xl font-serif font-semibold text-gray-800 leading-snug whitespace-pre-wrap select-text">{displayContent}</h2>
      </div>
    );
  }

  // depth 2+ : h3 스타일 (더 깊은 블록)
  return (
    <div className="mt-5 mb-2 select-text">
      {tagInfo && (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 mb-1.5 ${tagInfo.bgClass} border ${tagInfo.borderClass} rounded text-[10px] font-semibold ${tagInfo.colorClass} tracking-wide`}>
          {tagInfo.tag}
        </span>
      )}
      <h3 className="text-base font-serif font-medium text-gray-700 leading-snug whitespace-pre-wrap select-text">{displayContent}</h3>
    </div>
  );
};

export default CommentSection;
