/**
 * Default App Theme
 * Neutral gray-black tones for the entire application
 */

import type { AppTheme } from '../types';

export const defaultAppTheme: AppTheme = {
  name: 'default',

  colors: {
    // Main backgrounds - 더 어두운 검은색/회색 톤
    background: 'bg-[#070707]',       // 더 어두운 검은색
    canvas: 'bg-[#0d0d0d]',           // 캔버스 영역 (더 어둡게)
    sidebar: 'bg-[#121212]',          // 사이드바 (미묘한 구분)
    header: 'bg-[#0a0a0a]',           // 헤더 (더 어둡게)

    // Text colors - slate(파란기) → gray(중성)
    text: {
      primary: 'text-gray-200',       // 주요 텍스트
      secondary: 'text-gray-400',     // 보조 텍스트
      accent: 'text-gray-100',        // 강조 (파란색 제거, 밝은 회색)
    },

    // Interactive elements
    border: 'border-gray-700',        // 테두리 (중성 회색)
    hover: 'hover:bg-white/5',        // 호버 상태
    active: 'bg-white/10',            // 활성/선택 상태

    // Status colors
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    info: 'text-gray-300',            // info도 파란색 제거
  },

  effects: {
    blur: 'backdrop-blur-sm',
    shadow: 'shadow-lg shadow-black/50',
  },
};
