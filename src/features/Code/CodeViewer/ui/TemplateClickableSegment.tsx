import type React from 'react';
import { useEditorTheme } from '@/entities/AppTheme/EditorThemeProvider';

interface TemplateClickableSegmentProps {
  text: string;
  nodeId: string;
  expandToken: (nodeId: string, forceExpand: boolean) => void;
}

export function TemplateClickableSegment({ text, nodeId, expandToken }: TemplateClickableSegmentProps) {
  const theme = useEditorTheme();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    expandToken(nodeId, e.metaKey || e.ctrlKey);
  }

  return (
    <span
      onClick={handleClick}
      className={`inline-block px-0.5 rounded transition-all duration-200 select-text cursor-pointer border ${theme.colors.template.clickable.bg} ${theme.colors.template.clickable.border} ${theme.colors.template.clickable.text} ${theme.colors.template.clickable.hoverBg} ${theme.colors.template.clickable.hoverBorder}`}
    >
      {text}
    </span>
  );
}
