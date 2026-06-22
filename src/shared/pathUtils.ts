/**
 * Path Utilities - 파일 경로 처리 유틸리티
 *
 * 파일 경로 관련 공통 로직을 모아둔 유틸리티 모듈
 */

/**
 * 파일 경로에서 파일명만 추출
 * @example
 * getFileName('src/shared/ui/Button.tsx') // 'Button.tsx'
 * getFileName('Button.tsx') // 'Button.tsx'
 * getFileName('') // ''
 */
export function getFileName(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * 파일 경로에서 확장자를 제외한 파일명 추출
 * @example
 * getFileNameWithoutExt('src/shared/ui/Button.tsx') // 'Button'
 * getFileNameWithoutExt('README.md') // 'README'
 */
export function getFileNameWithoutExt(path: string): string {
  const fileName = getFileName(path);
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
}

/**
 * 파일 경로에서 확장자 추출
 * @example
 * getFileExtension('Button.tsx') // 'tsx'
 * getFileExtension('README.md') // 'md'
 * getFileExtension('no-extension') // ''
 */
export function getFileExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.slice(lastDotIndex + 1) : '';
}

/**
 * 파일 경로를 부분으로 분리 (빈 문자열 제거)
 * @example
 * splitPath('src/shared/ui/Button.tsx') // ['src', 'shared', 'ui', 'Button.tsx']
 * splitPath('/src/shared/ui/') // ['src', 'shared', 'ui']
 */
export function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * 경로 부분들을 조합하여 전체 경로 생성
 * @example
 * joinPath(['src', 'shared', 'ui', 'Button.tsx']) // 'src/shared/ui/Button.tsx'
 * joinPath(['src', 'shared', 'ui']) // 'src/shared/ui'
 */
export function joinPath(parts: string[]): string {
  return parts.join('/');
}

/**
 * 파일 경로에서 디렉토리 경로만 추출
 * @example
 * getDirectory('src/shared/ui/Button.tsx') // 'src/shared/ui'
 * getDirectory('Button.tsx') // ''
 */
export function getDirectory(path: string): string {
  const parts = splitPath(path);
  return parts.length > 1 ? joinPath(parts.slice(0, -1)) : '';
}

/**
 * 경로의 특정 깊이까지의 부분 경로 생성
 * @example
 * getPartialPath('src/shared/ui/Button.tsx', 2) // 'src/shared'
 * getPartialPath('src/shared/ui/Button.tsx', 0) // ''
 */
export function getPartialPath(path: string, depth: number): string {
  const parts = splitPath(path);
  return joinPath(parts.slice(0, depth));
}

/**
 * 두 경로의 공통 부분 추출
 * @example
 * getCommonPath('src/shared/ui/Button.tsx', 'src/shared/ui/Input.tsx') // 'src/shared/ui'
 * getCommonPath('src/a/b.tsx', 'lib/c/d.tsx') // ''
 */
export function getCommonPath(path1: string, path2: string): string {
  const parts1 = splitPath(path1);
  const parts2 = splitPath(path2);

  const commonParts: string[] = [];
  const minLength = Math.min(parts1.length, parts2.length);

  for (let i = 0; i < minLength; i++) {
    if (parts1[i] === parts2[i]) {
      commonParts.push(parts1[i]);
    } else {
      break;
    }
  }

  return joinPath(commonParts);
}

/**
 * 경로가 특정 디렉토리 아래에 있는지 확인
 * @example
 * isUnderDirectory('src/shared/ui/Button.tsx', 'src') // true
 * isUnderDirectory('src/shared/ui/Button.tsx', 'lib') // false
 */
export function isUnderDirectory(path: string, directory: string): boolean {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const normalizedDir = directory.startsWith('/') ? directory.slice(1) : directory;

  if (!normalizedDir) return true;

  return normalizedPath.startsWith(`${normalizedDir}/`) || normalizedPath === normalizedDir;
}

/**
 * 경로를 정규화 (중복 슬래시 제거, 앞뒤 슬래시 제거)
 * @example
 * normalizePath('/src//shared/ui/Button.tsx/') // 'src/shared/ui/Button.tsx'
 * normalizePath('//src/') // 'src'
 */
export function normalizePath(path: string): string {
  return path.split('/').filter(Boolean).join('/');
}
