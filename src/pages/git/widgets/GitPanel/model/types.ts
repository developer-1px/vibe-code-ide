export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  staged: boolean;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}
