/**
 * CodeSnippetSection - 코드를 스니펫 박스로 렌더링
 */

import React from 'react';
import type { CodeDocSection } from '../lib/types';
import { extractCommentTag, getCommentTagInfo, removeTagFromContent } from '../lib/commentTagUtils';

interface CodeSnippetSectionProps {
  section: CodeDocSection;
}

const CodeSnippetSection = ({ section }: CodeSnippetSectionProps) => {
  // comment와 fileHeader 제외, 모든 코드 타입 렌더링 (code, jsx, control, export)
  if (section.type === 'comment' || section.type === 'fileHeader') return null;

  const { content, startLine, relatedComment } = section;
  let lines = content.split('\n');

  // JSDoc/Block 주석 중복 제거
  // relatedComment가 JSDoc 또는 Block 스타일이면 코드 시작 부분의 주석 제거
  if (relatedComment && (relatedComment.commentStyle === 'jsdoc' || relatedComment.commentStyle === 'block')) {
    let inComment = false;
    let commentEndIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      // JSDoc 시작: /**
      if (trimmed.startsWith('/**')) {
        inComment = true;
      }
      // Block 시작: /*
      else if (trimmed.startsWith('/*')) {
        inComment = true;
      }

      // 주석 끝: */
      if (inComment && trimmed.endsWith('*/')) {
        commentEndIndex = i;
        break;
      }
    }

    // 주석 블록을 찾았으면 제거
    if (commentEndIndex >= 0) {
      lines = lines.slice(commentEndIndex + 1);
    }
  }

  // import/export 구문 필터링 (Dependencies 섹션이 대체)
  const filteredLines = lines
    .map((line, idx) => ({ line, lineNum: startLine + idx }))
    .filter(({ line }) => {
      const trimmed = line.trim();
      // import 구문 제거
      if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) return false;
      // export 구문은 유지 (함수/변수 선언)
      return true;
    });

  // 모든 라인이 필터링되면 렌더링 안 함
  if (filteredLines.length === 0) return null;

  // if 구문 감지 (첫 번째 비어있지 않은 라인이 if로 시작하는지)
  const firstCodeLine = filteredLines.find(({ line }) => line.trim().length > 0);
  const isIfStatement = firstCodeLine?.line.trim().startsWith('if ') || firstCodeLine?.line.trim().startsWith('if(');

  // 주석 태그 추출 (relatedComment가 있을 때)
  const commentTag = relatedComment ? extractCommentTag(relatedComment.content) : null;
  const commentTagInfo = commentTag ? getCommentTagInfo(commentTag) : null;
  const commentDisplayContent = relatedComment && commentTag
    ? removeTagFromContent(relatedComment.content, commentTag)
    : relatedComment?.content;

  return (
    <div className="select-text">
      {/* Related comment (블록 앞 주석) */}
      {relatedComment && (
        <div className="mt-8 mb-2">
          {/* 배지들 */}
          <div className="flex items-center gap-2 mb-1.5">
            {/* 주석 태그 배지 (TODO, FIXME 등) */}
            {commentTagInfo && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${commentTagInfo.bgClass} border ${commentTagInfo.borderClass} rounded text-[10px] font-semibold ${commentTagInfo.colorClass} tracking-wide`}>
                {commentTagInfo.tag}
              </span>
            )}
            {/* if 구문 배지 */}
            {isIfStatement && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 border border-purple-200 rounded text-[10px] font-semibold text-purple-700 tracking-wide">
                IF
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {commentDisplayContent}
          </div>
        </div>
      )}

      <div className="my-6 bg-gray-50 rounded-md overflow-hidden group border border-gray-100/50">
        {/* 코드 내용 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {filteredLines.map(({ line, lineNum }, idx) => (
                <tr key={idx}>
                  {/* 라인 번호 */}
                  <td className="px-3 py-1.5 text-[10px] text-gray-300 text-right select-none w-10 font-mono group-hover:text-gray-400 transition-colors align-top">
                    {lineNum}
                  </td>
                  {/* 코드 라인 */}
                  <td className="px-4 py-1.5 text-[13px] font-mono whitespace-pre select-text align-top">
                    <code className="text-gray-800 select-text leading-7">{line || ' '}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CodeSnippetSection;
