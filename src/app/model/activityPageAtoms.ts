import { atomWithStorage } from 'jotai/utils';
import type { ActivityPageId } from './activityPages';

export const activeActivityPageIdAtom = atomWithStorage<ActivityPageId>('activeActivityPageId', 'explorer');
