/**
 * loadTestData - 여러 JSON 데이터 소스 로더
 */

import testData from '@/test.json';
import test2Data from '@/test2.json';

export type DataSource = 'test.json' | 'test2.json' | 'custom';

export interface TestDataRoot {
  serverAndSelectableSoftwareProductPriceList: Record<string, unknown>[];
}

const PARENT_KEY_PATH_TEST1 = 'serverAndSelectableSoftwareProductPriceList';
const PARENT_KEY_PATH_TEST2 = 'serviceList';

/**
 * Get all data from specified source
 */
export function getDataFromSource(source: DataSource, customData?: Record<string, unknown>[]): {
  data: Record<string, unknown>[];
  parentKeyPath: string;
} {
  switch (source) {
    case 'test.json': {
      const data = testData as TestDataRoot;
      return {
        data: data.serverAndSelectableSoftwareProductPriceList,
        parentKeyPath: PARENT_KEY_PATH_TEST1,
      };
    }
    case 'test2.json': {
      // test2.json은 배열 형태
      const data = test2Data as Record<string, unknown>[];
      return {
        data,
        parentKeyPath: PARENT_KEY_PATH_TEST2,
      };
    }
    case 'custom': {
      return {
        data: customData || [],
        parentKeyPath: 'customData',
      };
    }
    default:
      return {
        data: [],
        parentKeyPath: '',
      };
  }
}

/**
 * Get limited data from specified source (for initial rendering)
 * @param source - Data source to load
 * @param limit - Number of items to return (default: 100)
 * @param customData - Custom data when source is 'custom'
 */
export function getLimitedData(
  source: DataSource,
  limit = 100,
  customData?: Record<string, unknown>[]
): Record<string, unknown>[] {
  const { data, parentKeyPath } = getDataFromSource(source, customData);

  // 맨 앞에 parent key path 추가
  return data.slice(0, limit).map((item, index) => ({
    __parentKeyPath: `${parentKeyPath}[${index}]`,
    ...item,
  }));
}

/**
 * Get total count from specified source
 */
export function getTotalCount(source: DataSource, customData?: Record<string, unknown>[]): number {
  const { data } = getDataFromSource(source, customData);
  return data.length;
}

// 하위 호환성을 위한 레거시 함수들
export function getServerProducts(): Record<string, unknown>[] {
  const { data } = getDataFromSource('test.json');
  return data;
}

export function getLimitedServerProducts(limit = 100): Record<string, unknown>[] {
  return getLimitedData('test.json', limit);
}

export function getTotalProductCount(): number {
  return getTotalCount('test.json');
}
