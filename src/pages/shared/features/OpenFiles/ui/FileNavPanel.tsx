/**
 * FileNavPanel - 우측 파일 네비게이션 패널
 * 파일 목록 표시 및 스크롤 네비게이션
 */

import { FileNavButton } from './FileNavButton';

const FileNavPanel = ({
  filePaths,
  currentFilePath,
  selectFile,
}: {
  filePaths: string[];
  currentFilePath: string | null;
  selectFile: (filePath: string) => void;
}) => {
  return (
    <div className="w-48 min-h-0 border-l border-border-DEFAULT bg-bg-elevated overflow-y-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-bg-elevated border-b border-border-DEFAULT px-3 py-2 z-10">
        <span className="text-xs font-medium text-text-secondary">Files ({filePaths.length})</span>
      </div>

      {/* 파일 목록 */}
      <div className="flex flex-col">
        {filePaths.map((filePath) => (
          <FileNavButton
            key={filePath}
            filePath={filePath}
            isActive={filePath === currentFilePath}
            selectFile={selectFile}
          />
        ))}
      </div>
    </div>
  );
};

export default FileNavPanel;
