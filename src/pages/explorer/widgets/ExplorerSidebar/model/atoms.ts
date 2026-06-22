import { atom } from 'jotai';

export const isSidebarOpenAtom = atom<boolean>(true);

export const fileTreeModeAtom = atom<'all' | 'related'>('all');
