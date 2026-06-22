import {
  BookOpenText,
  FileJson,
  Files,
  GitBranch,
  type LucideIcon,
  LucideMap,
  Presentation,
  SearchAlertIcon,
  Sparkles,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { PageAssistant } from '@/pages/assistant/PageAssistant';
import { PageCanvas } from '@/pages/canvas/PageCanvas';
import { PageCodeDoc } from '@/pages/code-doc/PageCodeDoc';
import { PageDeadCode } from '@/pages/dead-code/PageDeadCode';
import { PageExplorer } from '@/pages/explorer/PageExplorer';
import { PageGit } from '@/pages/git/PageGit';
import { PageJsonExplorer } from '@/pages/json-explorer/PageJsonExplorer';
import { PageSlides } from '@/pages/slides/PageSlides';
import type { ViewMode } from '../../entities/AppView/model/atoms';

export const ACTIVITY_PAGE_IDS = [
  'explorer',
  'code-doc',
  'slides',
  'canvas',
  'dead-code',
  'json-explorer',
  'assistant',
  'git',
] as const;

export type ActivityPageId = (typeof ACTIVITY_PAGE_IDS)[number];
export type ActivityPageGroup = 'primary' | 'secondary';

export interface ActivityPageDescriptor {
  id: ActivityPageId;
  label: string;
  icon: LucideIcon;
  Component: ComponentType;
  group: ActivityPageGroup;
  pageComponentName: string;
  pagePath: `src/pages/${string}/Page${string}.tsx`;
  legacyViewMode: ViewMode;
}

/**
 * ActivityBar page contract:
 * - one left-panel page icon maps to one flat src/pages/{slice}/Page*.tsx entry
 * - pages/{slice}/page and pages/{slice}/{ui|model|lib|hooks|controller} are not valid roots
 * - page-local layers live under pages/{slice}/{entities|features|widgets}/{SliceName}/{segment}
 */
export const activityPages = [
  {
    id: 'explorer',
    label: 'Explorer',
    icon: Files,
    Component: PageExplorer,
    group: 'primary',
    pageComponentName: 'PageExplorer',
    pagePath: 'src/pages/explorer/PageExplorer.tsx',
    legacyViewMode: 'ide',
  },
  {
    id: 'code-doc',
    label: 'Code Doc',
    icon: BookOpenText,
    Component: PageCodeDoc,
    group: 'primary',
    pageComponentName: 'PageCodeDoc',
    pagePath: 'src/pages/code-doc/PageCodeDoc.tsx',
    legacyViewMode: 'codeDoc',
  },
  {
    id: 'slides',
    label: 'Slides',
    icon: Presentation,
    Component: PageSlides,
    group: 'primary',
    pageComponentName: 'PageSlides',
    pagePath: 'src/pages/slides/PageSlides.tsx',
    legacyViewMode: 'ide',
  },
  {
    id: 'canvas',
    label: 'Canvas View',
    icon: LucideMap,
    Component: PageCanvas,
    group: 'primary',
    pageComponentName: 'PageCanvas',
    pagePath: 'src/pages/canvas/PageCanvas.tsx',
    legacyViewMode: 'canvas',
  },
  {
    id: 'dead-code',
    label: 'Dead Code',
    icon: SearchAlertIcon,
    Component: PageDeadCode,
    group: 'secondary',
    pageComponentName: 'PageDeadCode',
    pagePath: 'src/pages/dead-code/PageDeadCode.tsx',
    legacyViewMode: 'ide',
  },
  {
    id: 'json-explorer',
    label: 'JSON Explorer',
    icon: FileJson,
    Component: PageJsonExplorer,
    group: 'secondary',
    pageComponentName: 'PageJsonExplorer',
    pagePath: 'src/pages/json-explorer/PageJsonExplorer.tsx',
    legacyViewMode: 'jsonExplorer',
  },
  {
    id: 'assistant',
    label: 'AI Assistant',
    icon: Sparkles,
    Component: PageAssistant,
    group: 'secondary',
    pageComponentName: 'PageAssistant',
    pagePath: 'src/pages/assistant/PageAssistant.tsx',
    legacyViewMode: 'ide',
  },
  {
    id: 'git',
    label: 'Git',
    icon: GitBranch,
    Component: PageGit,
    group: 'secondary',
    pageComponentName: 'PageGit',
    pagePath: 'src/pages/git/PageGit.tsx',
    legacyViewMode: 'ide',
  },
] satisfies ActivityPageDescriptor[];

export const activityPageById = new Map<ActivityPageId, ActivityPageDescriptor>(
  activityPages.map((page) => [page.id, page])
);

export const primaryActivityPages = activityPages.filter((page) => page.group === 'primary');
export const secondaryActivityPages = activityPages.filter((page) => page.group === 'secondary');
