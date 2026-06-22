import { atom } from 'jotai';

export const isSidebarOpenAtom = atom<boolean>(true);

export type FileTreeMode = 'all' | 'related';

export const fileTreeModeAtom = atom<FileTreeMode>('all');
