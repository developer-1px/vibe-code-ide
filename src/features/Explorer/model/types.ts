export interface FolderNode {
  id: string; // 고유 ID (불변)
  parentId: string | null; // 부모 노드 ID
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  filePath?: string;
}

export interface FlatItem {
  id: string; // 고유 ID
  parentId: string | null; // 부모 ID
  type: 'folder' | 'file';
  path: string;
  filePath?: string;
}
