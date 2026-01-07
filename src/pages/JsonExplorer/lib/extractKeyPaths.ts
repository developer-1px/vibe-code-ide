/**
 * extractKeyPaths - JSON 데이터에서 모든 키 경로 추출
 */

/**
 * 단일 객체에서 모든 키 경로를 추출 (재귀적)
 * @example
 * { a: 1, b: { c: 2, d: 3 } } → ['a', 'b', 'b.c', 'b.d']
 */
function extractKeyPathsFromObject(
  obj: unknown,
  prefix = '',
  maxDepth = 3,
  currentDepth = 0
): Set<string> {
  const paths = new Set<string>();

  if (currentDepth >= maxDepth) {
    return paths;
  }

  if (obj === null || obj === undefined) {
    return paths;
  }

  if (typeof obj !== 'object') {
    return paths;
  }

  if (Array.isArray(obj)) {
    // 배열의 첫 번째 요소만 분석
    if (obj.length > 0) {
      const firstItem = obj[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        const subPaths = extractKeyPathsFromObject(firstItem, prefix, maxDepth, currentDepth);
        subPaths.forEach((path) => paths.add(path));
      }
    }
    return paths;
  }

  // 객체의 모든 키 처리
  Object.keys(obj).forEach((key) => {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    paths.add(currentPath);

    const value = (obj as Record<string, unknown>)[key];

    // 재귀적으로 중첩 객체 처리
    if (typeof value === 'object' && value !== null) {
      const subPaths = extractKeyPathsFromObject(value, currentPath, maxDepth, currentDepth + 1);
      subPaths.forEach((path) => paths.add(path));
    }
  });

  return paths;
}

/**
 * JSON 데이터 배열에서 모든 고유 키 경로 추출 (코드 노출 순서 유지)
 */
export function extractAllKeyPaths(data: Record<string, unknown>[], maxDepth = 3): string[] {
  const pathsOrder: string[] = [];
  const pathsSet = new Set<string>();

  // 최대 10개 샘플만 분석 (성능 최적화)
  const sampleSize = Math.min(10, data.length);

  for (let i = 0; i < sampleSize; i++) {
    const paths = extractKeyPathsFromObject(data[i], '', maxDepth);
    // Set을 배열로 변환하되 순서 유지
    Array.from(paths).forEach((path) => {
      if (!pathsSet.has(path)) {
        pathsOrder.push(path);
        pathsSet.add(path);
      }
    });
  }

  return pathsOrder; // 코드 노출 순서 유지
}

/**
 * 키 경로를 계층 구조로 변환
 */
export interface KeyPathNode {
  key: string;
  fullPath: string;
  depth: number;
  children: KeyPathNode[];
  isLeaf: boolean;
}

export function buildKeyPathTree(keyPaths: string[]): KeyPathNode[] {
  const root: KeyPathNode[] = [];
  const nodeMap = new Map<string, KeyPathNode>();

  keyPaths.forEach((path) => {
    const parts = path.split('.');
    let currentPath = '';

    parts.forEach((part, index) => {
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}.${part}` : part;

      if (!nodeMap.has(currentPath)) {
        const node: KeyPathNode = {
          key: part,
          fullPath: currentPath,
          depth: index,
          children: [],
          isLeaf: index === parts.length - 1,
        };

        nodeMap.set(currentPath, node);

        if (parentPath) {
          const parent = nodeMap.get(parentPath);
          if (parent) {
            parent.children.push(node);
            parent.isLeaf = false;
          }
        } else {
          root.push(node);
        }
      }
    });
  });

  return root;
}

/**
 * Schema Interface Node - TypeScript interface 형식으로 표현
 */
export interface SchemaInterfaceNode {
  interfaceName: string; // interface 이름 (필드명의 PascalCase + 번호)
  path: string; // 전체 경로 (예: "product.specs.cpu")
  fields: SchemaField[]; // interface 내부 필드들
  depth: number;
  fieldSignature: string; // 필드 구조 시그니처 (정렬된 필드명 리스트)
}

export interface SchemaField {
  name: string; // 필드명
  type: string; // 타입 (string, number, boolean, InterfaceName, InterfaceName[])
  isArray: boolean;
  isOptional: boolean; // 일부 샘플에만 존재하는 필드
  fullPath: string; // 전체 경로
}

/**
 * JSON 데이터에서 TypeScript interface 형식 스키마 추출
 * transform.tools 방식: 같은 경로는 하나의 interface로 병합, 선택적 필드는 optional로 표시
 */
export function extractSchemaInterfaces(data: Record<string, unknown>[]): SchemaInterfaceNode[] {
  if (data.length === 0) return [];

  // path별로 하나의 interface만 저장 (key: path, value: SchemaInterfaceNode)
  const interfacesByPath = new Map<string, SchemaInterfaceNode>();
  // path별 샘플 카운트 (필드가 몇 개 샘플에 나타나는지 추적)
  const fieldCountsByPath = new Map<string, Map<string, number>>();

  // 샘플 데이터 분석 (최대 20개)
  const sampleSize = Math.min(20, data.length);

  // 재귀적으로 객체 분석하여 필드 정보 수집
  function analyzeObject(obj: unknown, prefix: string, depth: number, sampleIndex: number): string | null {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return getPrimitiveType(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'unknown[]';
      const itemType = analyzeObject(obj[0], prefix, depth, sampleIndex);
      return itemType ? `${itemType}[]` : 'unknown[]';
    }

    const objRecord = obj as Record<string, unknown>;
    const keys = Object.keys(objRecord);

    // 빈 객체
    if (keys.length === 0) return 'object';

    // 이 경로의 interface 가져오기 또는 생성
    let interfaceNode = interfacesByPath.get(prefix);
    let fieldCounts = fieldCountsByPath.get(prefix);

    if (!interfaceNode) {
      // 첫 번째 샘플 - 새 interface 생성
      const baseName = pathToInterfaceName(prefix);

      interfaceNode = {
        interfaceName: baseName,
        path: prefix,
        fields: [],
        depth,
        fieldSignature: '', // 나중에 업데이트
      };
      interfacesByPath.set(prefix, interfaceNode);

      fieldCounts = new Map<string, number>();
      fieldCountsByPath.set(prefix, fieldCounts);
    }

    // 모든 필드 처리
    keys.forEach((key) => {
      const value = objRecord[key];
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      // 필드 카운트 증가
      fieldCounts!.set(key, (fieldCounts!.get(key) || 0) + 1);

      // 필드 타입 분석
      let fieldType: string;
      let isArray = false;

      if (Array.isArray(value)) {
        isArray = true;
        if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const itemTypeName = analyzeObject(value[0], fieldPath, depth + 1, sampleIndex);
          fieldType = itemTypeName || 'unknown';
        } else {
          const itemType = getPrimitiveType(value[0]);
          fieldType = itemType || 'unknown';
        }
      } else if (typeof value === 'object' && value !== null) {
        const nestedTypeName = analyzeObject(value, fieldPath, depth + 1, sampleIndex);
        fieldType = nestedTypeName || 'object';
      } else {
        fieldType = getPrimitiveType(value) || 'unknown';
      }

      // 기존 필드 찾기
      const existingField = interfaceNode!.fields.find(f => f.name === key);

      if (existingField) {
        // 타입이 다르면 Union type으로 병합
        if (existingField.type !== fieldType) {
          const types = new Set(existingField.type.split(' | '));
          types.add(fieldType);
          existingField.type = Array.from(types).join(' | ');
        }
      } else {
        // 새 필드 추가
        interfaceNode!.fields.push({
          name: key,
          type: fieldType,
          isArray,
          isOptional: false, // 나중에 업데이트
          fullPath: fieldPath,
        });
      }
    });

    return interfaceNode.interfaceName;
  }

  // Primitive 타입 추출
  function getPrimitiveType(value: unknown): string | null {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]';
      const itemType = getPrimitiveType(value[0]);
      return itemType ? `${itemType}[]` : 'unknown[]';
    }
    return null;
  }

  // 경로를 PascalCase interface 이름으로 변환
  function pathToInterfaceName(path: string): string {
    if (!path) return 'Root';

    // "product.specs.cpu" → "ProductSpecsCpu"
    return path
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  // 모든 샘플 분석
  for (let i = 0; i < sampleSize; i++) {
    analyzeObject(data[i], '', 0, i);
  }

  // optional 필드 마킹 및 fieldSignature 생성
  interfacesByPath.forEach((interfaceNode, path) => {
    const fieldCounts = fieldCountsByPath.get(path)!;
    const totalSamplesForPath = Math.max(...Array.from(fieldCounts.values()));

    interfaceNode.fields.forEach((field) => {
      const fieldCount = fieldCounts.get(field.name) || 0;
      // 모든 샘플에 존재하지 않으면 optional
      field.isOptional = fieldCount < totalSamplesForPath;
    });

    // 필드명 정렬하여 시그니처 생성
    interfaceNode.fieldSignature = interfaceNode.fields
      .map(f => f.name)
      .sort()
      .join(',');
  });

  // Map을 배열로 변환
  return Array.from(interfacesByPath.values());
}
