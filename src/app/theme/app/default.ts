/**
 * Default App Theme
 * Neutral gray-black tones for the entire application
 */

import type { AppTheme } from '../types';

export const defaultAppTheme: AppTheme = {
  name: 'default',

  colors: {
    // Main backgrounds - 파란색 톤 제거, 검은색/회색으로
    background: 'bg-[#0a0a0a]',       // 거의 검은색
    canvas: 'bg-[#121212]',           // 약간 밝은 검은색 (캔버스 영역)
    sidebar: 'bg-[#1a1a1a]',          // 사이드바 (약간 구분)
    header: 'bg-[#0f0f0f]',           // 헤더 (미묘한 차이)

    // Text colors
    text: {
      primary: 'text-slate-200',      // 주요 텍스트
      secondary: 'text-slate-400',    // 보조 텍스트
      accent: 'text-cyan-400',        // 강조 (vibe-accent)
    },

    // Interactive elements
    border: 'border-slate-700',       // 테두리
    hover: 'hover:bg-white/5',        // 호버 상태
    active: 'bg-white/10',            // 활성/선택 상태

    // Status colors
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    info: 'text-sky-400',
  },

  effects: {
    blur: 'backdrop-blur-sm',
    shadow: 'shadow-lg shadow-black/50',
  },
};
