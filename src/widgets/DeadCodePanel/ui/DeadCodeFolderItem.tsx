/**
 * DeadCodeFolderItem - Folder rendering in category tree
 */
import { Folder, FolderOpen } from 'lucide-react';
import { FileTreeItem } from '@/components/ide/FileTreeItem';
import { useAtom } from 'jotai';
import { focusedIndexAtom } from '../../../features/DeadCodeAnalyzer/model/atoms';

export function DeadCodeFolderItem({
  name,
  depth,
  isCollapsed,
  globalItemIndex,
  itemRefs,
  onDoubleClick,
}: {
  name: string;
  depth: number;
  isCollapsed: boolean;
  globalItemIndex: number;
  itemRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  onDoubleClick: () => void;
}) {
  const [focusedIndex, setFocusedIndex] = useAtom(focusedIndexAtom);
  const isFocused = focusedIndex === globalItemIndex;
  const icon = isCollapsed ? Folder : FolderOpen;

  return (
    <FileTreeItem
      ref={(el) => {
        if (el) {
          itemRefs.current.set(globalItemIndex, el);
        }
      }}
      icon={icon}
      label={name}
      isFolder
      isOpen={!isCollapsed}
      focused={isFocused}
      indent={depth}
      onFocus={() => setFocusedIndex(globalItemIndex)}
      onDoubleClick={onDoubleClick}
    />
  );
}
