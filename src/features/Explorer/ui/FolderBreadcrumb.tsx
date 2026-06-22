/**
 * FolderBreadcrumb - Folder Focus Mode 경로 표시
 *
 * ← Back | Home > src > features > UnifiedSearch
 */
import { useSetAtom } from 'jotai';
import React from 'react';
import { focusedFolderAtom } from '@/entities/AppView/model/atoms';

interface FolderBreadcrumbProps {
  focusedFolder: string;
}

interface FolderBreadcrumbSegmentProps {
  segment: string;
  path: string;
  isCurrent: boolean;
}

function FolderBreadcrumbSegment({ segment, path, isCurrent }: FolderBreadcrumbSegmentProps) {
  const setFocusedFolder = useSetAtom(focusedFolderAtom);

  function handleClick() {
    setFocusedFolder(path);
  }

  return (
    <>
      <span className="text-text-tertiary">&gt;</span>
      <button
        onClick={handleClick}
        className={`hover:text-text-primary transition-colors ${isCurrent ? 'text-text-primary font-medium' : ''}`}
        title={`${path}로 이동`}
      >
        {segment}
      </button>
    </>
  );
}

export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({ focusedFolder }) => {
  const setFocusedFolder = useSetAtom(focusedFolderAtom);

  // 경로를 세그먼트로 분할
  const segments = focusedFolder.split('/').filter(Boolean);

  // 상위 폴더 경로 계산
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join('/') : null;

  // 각 세그먼트의 전체 경로 계산
  const getPaths = () => {
    return segments.map((_, index) => {
      return segments.slice(0, index + 1).join('/');
    });
  };

  const paths = getPaths();

  function handleBackClick() {
    setFocusedFolder(parentPath);
  }

  function handleHomeClick() {
    setFocusedFolder(null);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated border-b border-border text-sm text-text-secondary">
      {/* Back 버튼 */}
      <button
        onClick={handleBackClick}
        className="flex items-center gap-1 hover:text-text-primary transition-colors"
        title="상위 폴더로 이동"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <span className="text-text-tertiary">|</span>

      {/* Home 버튼 */}
      <button
        onClick={handleHomeClick}
        className="hover:text-text-primary transition-colors"
        title="전체 파일 트리 보기"
      >
        Home
      </button>

      {/* 경로 세그먼트 */}
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          <FolderBreadcrumbSegment segment={segment} path={paths[index]} isCurrent={index === segments.length - 1} />
        </React.Fragment>
      ))}
    </div>
  );
};
