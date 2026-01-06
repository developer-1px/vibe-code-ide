import { Package } from 'lucide-react';
import { useOpenFile } from '@/features/File/OpenFiles/lib/useOpenFile';
import type { DependencyItem } from '@/shared/dependencyAnalyzer';
import { FileIcon } from '@/entities/SourceFileNode/ui/FileIcon';

interface RelatedPanelItemProps {
  item: DependencyItem;
  depth: number;
}

export function RelatedPanelItem({ item, depth }: RelatedPanelItemProps) {
  const { openFile } = useOpenFile();

  const handleClick = () => {
    if (!item.isNpm) {
      openFile(item.filePath);
    }
  };

  // 파일명 추출 (경로에서 파일명만, 확장자 포함)
  const fileName = item.isNpm
    ? item.filePath // NPM 모듈은 패키지명 전체
    : item.filePath.split('/').pop() || item.filePath;

  // NPM 모듈은 indent 없음, 로컬 파일은 depth에 따라 indent
  const indentStyle = item.isNpm ? {} : { paddingLeft: `calc(12px + ${depth} * var(--limn-indent))` };

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 text-xs ${
        item.isNpm
          ? 'text-text-tertiary cursor-default'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-deep/50 cursor-pointer'
      } transition-colors`}
      style={indentStyle}
      onClick={handleClick}
      title={item.isNpm ? `NPM: ${item.filePath}` : item.filePath}
    >
      {/* Icon */}
      {item.isNpm ? (
        <Package size={12} className="text-warm-300 shrink-0" />
      ) : (
        <FileIcon fileName={fileName} size={12} className="text-text-tertiary" />
      )}

      {/* File name */}
      <span className="flex-1 truncate whitespace-nowrap overflow-hidden text-ellipsis">{fileName}</span>

      {/* Depth badge (optional, for debugging) */}
      {/* <span className="text-3xs text-text-faint">d{depth}</span> */}
    </div>
  );
}
