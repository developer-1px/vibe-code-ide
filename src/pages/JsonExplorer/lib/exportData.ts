/**
 * exportData - 데이터 내보내기 유틸리티
 * CSV, JSON 형식으로 변환 및 다운로드
 */

/**
 * JSON 데이터를 CSV 문자열로 변환
 */
export function jsonToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  // 모든 키 추출 (순서 유지)
  const keysSet = new Set<string>();
  const keys: string[] = [];

  // 첫 번째 객체의 키 순서 기준
  Object.keys(data[0]).forEach((key) => {
    keys.push(key);
    keysSet.add(key);
  });

  // 나머지 객체에서 누락된 키 추가
  data.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (!keysSet.has(key)) {
        keys.push(key);
        keysSet.add(key);
      }
    });
  });

  // CSV 헤더
  const header = keys.map((key) => `"${key}"`).join(',');

  // CSV 행들
  const rows = data.map((item) => {
    return keys
      .map((key) => {
        const value = item[key];

        // null/undefined 처리
        if (value === null || value === undefined) {
          return '';
        }

        // 문자열 처리 (따옴표 이스케이프)
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }

        // 숫자/불린
        if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }

        // 객체/배열은 JSON 문자열로
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * CSV 파일 다운로드
 */
export function downloadCsv(data: Record<string, unknown>[], filename = 'export.csv') {
  const csv = jsonToCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * JSON 파일 다운로드
 */
export function downloadJson(data: Record<string, unknown>[], filename = 'export.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 클립보드에 JSON 복사
 */
export async function copyToClipboard(data: Record<string, unknown>[]): Promise<boolean> {
  try {
    const json = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(json);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
