/**
 * FileIcon - Unified file icon component
 * 파일 확장자에 따라 적절한 아이콘을 렌더링
 */

import { Code2, CodeXml, SquareFunction } from 'lucide-react';

interface FileIconProps {
  fileName: string;
  size?: number;
  className?: string;
}

/**
 * 파일 확장자 기반 아이콘 컴포넌트
 * - .tsx, .vue → CodeXml
 * - .ts, .js, .jsx → SquareFunction
 * - default → Code2
 * - shrink-0 클래스 기본 포함
 * - wrapper로 감싸서 SVG 찌그러짐 방지
 */
export function FileIcon({ fileName, size = 12, className = '' }: FileIconProps) {
  const ext = fileName.includes('.') ? `.${fileName.split('.').pop()}` : '';
  const wrapperClassName = `shrink-0 flex items-center justify-center ${className}`.trim();
  const wrapperStyle = { width: `${size}px`, height: `${size}px` };

  let IconComponent: typeof Code2;
  switch (ext.toLowerCase()) {
    case '.tsx':
    case '.vue':
      IconComponent = CodeXml;
      break;
    case '.ts':
    case '.js':
    case '.jsx':
      IconComponent = SquareFunction;
      break;
    default:
      IconComponent = Code2;
  }

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <IconComponent size={size} />
    </div>
  );
}
