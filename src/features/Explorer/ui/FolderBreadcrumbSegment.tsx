import { useSetAtom } from 'jotai';
import { focusedFolderAtom } from '@/entities/AppView/model/atoms';

interface FolderBreadcrumbSegmentProps {
  segment: string;
  path: string;
  isCurrent: boolean;
}

export function FolderBreadcrumbSegment({ segment, path, isCurrent }: FolderBreadcrumbSegmentProps) {
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
