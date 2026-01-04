/**
 * Default Editor Theme
 * Extracts current hardcoded values into a JSON-serializable theme object
 */

import type { EditorTheme } from '../types';

export const defaultEditorTheme: EditorTheme = {
  name: 'default',
  typography: {
    fontSize: 'text-[11px]',
    fontFamily: 'font-mono',
    lineHeight: 'leading-[1rem]',
  },
  colors: {
    background: '', // @TODO
    lineNumber: {
      text: 'text-slate-600',
      background: 'bg-[#0a0c10]/50', // 배경과 조화롭게
      border: 'border-white/5',
    },
    code: {
      normal: 'text-slate-300',
      comment: {
        normal: 'text-slate-400/85',
        focus: 'text-slate-400', // Brighter in focus mode
      },
    },
    template: {
      text: 'text-slate-300',
      clickable: {
        bg: 'bg-slate-800/50',
        border: 'border-slate-700',
        text: 'text-emerald-300',
        hoverBg: 'hover:bg-white/10',
        hoverBorder: 'hover:border-emerald-500/50',
      },
    },
  },
  spacing: {
    containerY: 'py-2',
    lineX: 'px-3',
    lineY: '',
    lineNumberX: 'pr-2',
  },
  dimensions: {
    lineNumberWidth: 'w-16',
    slotSize: 'w-1.5 h-1.5', // Reduced from w-2 h-2 (8px → 6px)
    slotSpacing: 4, // Reduced spacing for smaller slots
  },
};
