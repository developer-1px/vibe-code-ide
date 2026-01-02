# Vibe Code Viewer - 리팩토링 분석 보고서

## 1. 코드 중복 (Code Duplication)

### 1.1 렌더링 로직 중복 - 심각
**파일**: 
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeCard/CodeCard.tsx` (Line 25-32)
- `/Users/user/Desktop/vibe-code-viewer/src/features/FocusMode/ui/FocusedIdentifiers.tsx` (Line 30-35)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/IDEView/IDEView.tsx` (Line 32-39)

**문제**: Vue 파일과 일반 파일 렌더링 로직이 3곳에서 반복됨
```typescript
// 반복되는 패턴
const processedLines = useMemo(() => {
  if (node.filePath.endsWith('.vue')) {
    return renderVueFile(node, files);
  }
  return renderCodeLinesDirect(node, files);
}, [node, files]);
```

**심각도**: High

**제안 개선안**:
- 커스텀 훅 추출: `useRenderCodeLines(node, files)` 생성
- `src/hooks/useRenderCodeLines.ts` 파일로 이동

---

### 1.2 이벤트 리스너 등록/제거 패턴 중복 - 보통 ✅ **완료**

**파일**:
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/Sidebar/Sidebar.tsx` (Line 15-38)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/PipelineCanvas/CanvasCodeCard.tsx` (Line 86-117)

**문제**: mousemove/mouseup 이벤트 등록 및 정리 로직이 반복
```typescript
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => { /* ... */ };
  const handleMouseUp = () => { /* ... */ };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [dependencies]);
```

**심각도**: Medium

**적용된 개선안**: ✅
- **@use-gesture/react** 라이브러리 도입
- `useDrag` 훅으로 모든 드래그 로직 대체
- 수동 이벤트 리스너 관리 제거 (38줄 → 10줄)

**개선 효과**:
```typescript
// Before (38줄 - useEffect + addEventListener)
const [isResizing, setIsResizing] = useState(false);
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => { /* ... */ };
  const handleMouseUp = () => { setIsResizing(false); };
  if (isResizing) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isResizing]);

// After (10줄 - useDrag)
const bind = useDrag(({ movement: [mx], first }) => {
  if (first) initialWidth.current = width;
  const newWidth = initialWidth.current + mx;
  if (newWidth >= 250 && newWidth <= 800) {
    setWidth(newWidth);
  }
});
```

**주요 개선 사항**:
1. **코드 간결화**: 38줄 → 10줄 (74% 감소)
2. **메모리 누수 방지**: 이벤트 리스너 자동 정리
3. **터치 이벤트 지원**: `touch-none` CSS로 모바일 대응
4. **선언적 코드**: 명령형 → 선언형 패턴
5. **타입 안전성**: TypeScript 완벽 지원

**적용 날짜**: 2026-01-01

---

### 1.3 키보드 이벤트 리스너 패턴 중복 - 보통 ✅ **완료**

**파일**:
- `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/ui/UnifiedSearchModal.tsx` (Line 61-79)
- `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/ui/SearchResults.tsx` (Line 132-142)

**문제**: 키보드 이벤트를 addEventListener로 수동 관리
```typescript
// UnifiedSearchModal.tsx
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { /* ... */ }
    else if (e.key === 'ArrowDown') { /* ... */ }
    else if (e.key === 'ArrowUp') { /* ... */ }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, results.length, setFocusedIndex]);

// SearchResults.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) { /* ... */ }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [focusedIndex, results, handleSelectResult]);
```

**심각도**: Medium

**적용된 개선안**: ✅
- **react-hotkeys-hook** 라이브러리 활용 (이미 설치됨)
- `useHotkeys` 훅으로 모든 키보드 이벤트 대체
- 수동 이벤트 리스너 관리 제거 (28줄 → 19줄)

**개선 효과**:
```typescript
// Before (18줄 - useEffect + addEventListener)
useEffect(() => {
  if (!isOpen) return;
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(prev => ...); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(prev => ...); }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, results.length, setFocusedIndex]);

// After (14줄 - useHotkeys)
useHotkeys('escape', (e) => {
  e.preventDefault();
  handleClose();
}, { enabled: isOpen });

useHotkeys('down', (e) => {
  e.preventDefault();
  setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
}, { enabled: isOpen });

useHotkeys('up', (e) => {
  e.preventDefault();
  setFocusedIndex((prev) => Math.max(prev - 1, 0));
}, { enabled: isOpen });
```

**주요 개선 사항**:
1. **코드 간결화**: 28줄 → 19줄 (32% 감소)
2. **가독성 향상**: 키별로 독립된 핸들러 분리
3. **조건부 활성화**: `enabled` 옵션으로 모달 열림 상태에서만 작동
4. **메모리 누수 방지**: 이벤트 리스너 자동 정리
5. **선언적 코드**: 명령형 → 선언형 패턴

**리팩토링된 파일**:
- `UnifiedSearchModal.tsx`: Escape, ArrowDown, ArrowUp (18줄 → 14줄)
- `SearchResults.tsx`: Enter (10줄 → 5줄)

**참고**: `KeyboardShortcuts.tsx`의 Shift+Shift 더블탭은 타이밍 로직이 필요하여 수동 처리 유지

**적용 날짜**: 2026-01-01

---

### 1.4 파일 경로 처리 로직 중복 - 보통 ✅ **완료**

**파일**:
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/MainContent/Header.tsx` (Line 21)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/Sidebar/FolderView.tsx` (Line 49, 54)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeCard/ui/CodeCardHeader.tsx` (Line 227)
- `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/lib/symbolExtractor.ts` (Line 126, 162, 186)
- `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/lib/fuzzySearchWorker.ts` (Line 76)
- `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/ui/SearchResultItem.tsx` (Line 124)

**문제**: 파일 경로를 파일명으로 변환하는 로직이 11곳에서 반복
```typescript
// Pattern 1: 파일명 추출
const name = path.split('/').pop() || path

// Pattern 2: 경로 분리
const parts = filePath.split('/').filter(Boolean)

// Pattern 3: 경로 조합
const currentPath = parts.slice(0, index + 1).join('/')
```

**심각도**: Low

**적용된 개선안**: ✅
- **shared/pathUtils.ts** 유틸리티 모듈 생성
- 11개 함수 제공: `getFileName`, `getFileNameWithoutExt`, `getFileExtension`, `splitPath`, `joinPath` 등
- 11곳의 중복 코드를 유틸 함수 호출로 대체

**개선 효과**:
```typescript
// Before (중복된 패턴)
const name = path.split('/').pop() || path;
const parts = filePath.split('/').filter(Boolean);
const currentPath = parts.slice(0, index + 1).join('/');

// After (유틸 함수 사용)
import { getFileName, splitPath, joinPath } from '@/shared/pathUtils';

const name = getFileName(path);
const parts = splitPath(filePath);
const currentPath = joinPath(parts.slice(0, index + 1));
```

**생성된 유틸 함수들**:
1. **getFileName(path)** - 파일명 추출
2. **getFileNameWithoutExt(path)** - 확장자 제외 파일명
3. **getFileExtension(path)** - 확장자 추출
4. **splitPath(path)** - 경로를 배열로 분리
5. **joinPath(parts)** - 배열을 경로로 조합
6. **getDirectory(path)** - 디렉토리 경로 추출
7. **getPartialPath(path, depth)** - 특정 깊이까지 경로
8. **getCommonPath(path1, path2)** - 공통 경로 추출
9. **isUnderDirectory(path, dir)** - 하위 디렉토리 확인
10. **normalizePath(path)** - 경로 정규화

**주요 개선 사항**:
1. **코드 재사용성**: 11곳의 중복 제거
2. **가독성 향상**: 의도가 명확한 함수명
3. **유지보수성**: 한 곳에서 로직 관리
4. **타입 안전성**: TypeScript 완벽 지원
5. **확장성**: 향후 경로 처리 로직 추가 용이

**리팩토링된 파일 (7개)**:
- `Header.tsx`: `path.split('/').pop()` → `getFileName(path)`
- `FolderView.tsx`: `filePath.split('/').filter(Boolean)` → `splitPath(filePath)`
- `FolderView.tsx`: `parts.slice(0, index + 1).join('/')` → `joinPath(...)`
- `CodeCardHeader.tsx`: `node.filePath.split('/').pop()` → `getFileName(node.filePath)`
- `symbolExtractor.ts`: 3곳에서 `split('/').pop()` → `getFileName()`
- `fuzzySearchWorker.ts`: `item.filePath.split('/').pop()` → `getFileName()`
- `SearchResultItem.tsx`: `result.filePath.split('/').pop()` → `getFileName()`

**적용 날짜**: 2026-01-01

---

## 2. 복잡한 함수 (Complex Functions)

### 2.1 renderCodeLinesDirect - 매우 높은 순환 복잡도
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/core/renderer/renderCodeLinesDirect.ts`

**문제**: 
- 494줄의 메인 함수
- 중첩된 visit 함수 (40줄)
- 라인별 처리, 세그먼트 추가, 주석 처리, 언어 서비스 등이 모두 한 파일에 섞여있음
- 순환 복잡도 추정: 25+

**심각도**: Critical

**제안 개선안**:
```
현재: renderCodeLinesDirect.ts (494줄)

리팩토링 후:
├── renderCodeLinesDirect.ts (메인 오케스트레이션, ~100줄)
├── astVisitor.ts (AST 순회 로직)
├── segmentProcessor.ts (세그먼트 처리)
├── commentProcessor.ts (주석 처리)
└── lineFinalization.ts (라인 마무리)
```

---

### 2.2 FolderView - 높은 책임도
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/widgets/Sidebar/FolderView.tsx`

**문제**:
- 파일 트리 생성 (~60줄)
- 정렬 로직 (~20줄)
- 평면 리스트 생성 (~15줄)
- 키보드 네비게이션 (생략됨)
- 모두 한 컴포넌트에 포함됨

**심각도**: High

**제안 개선안**:
```
리팩토링 후:
├── FolderView.tsx (렌더링 전용, ~80줄)
├── useFolderTree.ts (트리 생성 훅)
├── useFlatItemList.ts (평면 리스트 훅)
└── folderTreeUtils.ts (유틸 함수)
```

---

### 2.3 collectFoldMetadata - 매우 높은 중첩도
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/features/CodeFold/lib/collectFoldMetadata.ts`

**문제**:
- 256줄 파일
- 깊은 중첩 (visit 함수 내 여러 if/else if 분기)
- import 블록, 함수, if/for/while, try, JSX 등 다양한 노드 처리
- 각 노드 유형마다 3-5줄의 동일한 fold 메타데이터 추가 코드 반복

**심각도**: High

**제안 개선안**:
- 노드 타입별 핸들러로 분해
- 전략 패턴(Strategy Pattern) 적용
- Fold 메타데이터 생성 로직 추출

---

### 2.4 PipelineCanvas - 과도한 책임도
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/widgets/PipelineCanvas.tsx`

**문제**:
- 197줄
- 여러 atom 관리 (visibleNodeIds, openedFiles, selectedNodeIds 등)
- 파일-노드 동기화 로직
- Delete/Backspace 핸들러 (~60줄 복잡한 로직)
- Symbol 메타데이터 추출
- 레이아웃 계산
- 모두 한 파일에

**심각도**: High

**제안 개선안**:
```
리팩토링 후:
├── PipelineCanvas.tsx (메인 렌더링 전용)
├── usePipelineState.ts (상태 관리 훅)
├── useFileNodeSync.ts (파일-노드 동기화)
├── useSymbolMetadata.ts (심볼 메타데이터 추출)
└── usePipelineKeyboard.ts (키보드 이벤트)
```

---

## 3. 타입 안정성 문제 (Type Safety Issues)

### 3.1 'any' 타입 사용 - 심각
**파일들**:
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/core/renderer/astHooks.ts` (Line 47)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/ui/CodeLineView.tsx` (Line 56)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/core/renderer/renderCodeLinesDirect.ts` (Line 366)
- `/Users/user/Desktop/vibe-code-viewer/src/shared/tsParser/index.ts` (Line 183)
- 기타 10개 파일

**예시**:
```typescript
// astHooks.ts:47
const modifiers = (node as any).modifiers;

// renderCodeLinesDirect.ts:366
const sourceFile = (node as any).sourceFile as ts.SourceFile | undefined;

// CodeLineView.tsx:56
const sourceFile = (n as any).sourceFile as ts.SourceFile | undefined;
```

**심각도**: High

**제안 개선안**:
```typescript
// 올바른 방식
interface NodeWithSourceFile extends ts.Node {
  sourceFile?: ts.SourceFile;
}

// 또는
type SafeNode<T extends ts.Node> = T & {
  modifiers?: ts.Modifier[];
};
```

---

### 3.2 searchModeAtom 미사용
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/ui/UnifiedSearchModal.tsx`

**문제**: 
- `searchModeAtom`이 import 되지만 사용되지 않음 (Line 13)
- 중복 상태 관리 (search query와 mode 분리 필요성 불명확)

**심각도**: Medium

**제안 개선안**:
- 미사용 import 제거
- 또는 쿼리와 모드를 같이 관리하려면 구현 완료

---

## 4. 큰 컴포넌트 (Large Components)

### 4.1 CodeLineView - 200줄, 높은 책임도
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/ui/CodeLineView.tsx`

**문제**:
- 라인 렌더링
- 선언 감지
- Export 심볼 사용 횟수 계산
- Fold 상태 관리
- 타겟 라인 자동 스크롤
- 모두 한 컴포넌트에

**심각도**: High

**제안 개선안**:
```
리팩토링 후:
├── CodeLineView.tsx (메인 렌더링, ~100줄)
├── CodeLineDeclaration.tsx (선언 부분)
├── CodeLineContent.tsx (코드 콘텐츠)
├── CodeLinePortSlots.tsx (Output/Input 포트)
└── useLineMetadata.ts (메타데이터 계산)
```

---

### 4.2 UnifiedSearchModal - 200줄 이상
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/ui/UnifiedSearchModal.tsx`

**문제**:
- 검색 로직
- 결과 필터링
- 키보드 네비게이션
- UI 렌더링
- 모두 한 파일

**심각도**: Medium

**제안 개선안**:
```
리팩토링 후:
├── UnifiedSearchModal.tsx (메인, ~80줄)
├── SearchModalContent.tsx (콘텐츠)
└── useSearchLogic.ts (검색 로직)
```

---

## 5. Props Drilling 문제 (CLAUDE.md 위반)

### 5.1 FoldButton/FoldBadge - Props 전달
**파일**:
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/ui/CodeLineView.tsx` (Line 135-161)

**문제**:
```typescript
<FoldButton line={line} node={node} />
<FoldBadge line={line} node={node} isFolded={isFolded} foldedCount={foldedCount} />
```

- Props를 통해 fold 상태 전달
- CLAUDE.md에서 "Data via props, handlers via atoms"이므로 OK
- 하지만 foldedLinesAtom에서 직접 읽을 수 있어야 함

**심각도**: Low (현재는 OK, 하지만 최적화 여지있음)

---

### 5.2 CodeLineSegment - Props 과다
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/widgets/CodeViewer/ui/CodeLineView.tsx` (Line 143-153)

**문제**:
```typescript
<CodeLineSegment
  key={segIdx}
  segment={segment}
  segIdx={segIdx}
  node={node}
  line={line}
  isFolded={isFolded}
  foldedCount={foldedCount}
/>
```

- 8개의 props 전달
- segment 정보 중복 전달 가능

**심각도**: Medium

---

## 6. 레거시 패턴 (Legacy Patterns)

### 6.1 과도한 콘솔 로깅 - 심각
**발생 위치**: 91개의 console.log/warn/error 호출

**주요 파일**:
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/Sidebar/FolderView.tsx` (Line 143, 149)
- `/Users/user/Desktop/vibe-code-viewer/src/widgets/PipelineCanvas/CanvasCodeCard.tsx` (Multiple)
- `/Users/user/Desktop/vibe-code-viewer/src/shared/symbolMetadataExtractor.ts` (Multiple)
- 기타 30개 파일

**문제**: 
- 디버깅용 콘솔 로그가 프로덕션 코드에 남아있음
- 성능 저하 가능성
- 보안 정보 노출 가능성

**심각도**: Medium

**제안 개선안**:
```typescript
// 적절한 로깅 유틸 생성
// src/shared/logger.ts
export const createLogger = (tag: string) => {
  const isDev = process.env.NODE_ENV === 'development';
  return {
    log: (...args: any[]) => isDev && console.log(`[${tag}]`, ...args),
    warn: (...args: any[]) => console.warn(`[${tag}]`, ...args),
    error: (...args: any[]) => console.error(`[${tag}]`, ...args),
  };
};
```

---

### 6.2 비정규화된 상태 관리
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/store/atoms.ts`

**문제**:
- `layoutNodesAtom`, `fullNodeMapAtom`, `layoutLinksAtom` 모두 같은 데이터 소스
- `layoutNodesAtom`은 `layoutNodesAtom`과 `layoutLinksAtom`에서 파생 가능
- 중복 관리, 동기화 위험

**심각도**: Medium

**제안 개선안**:
```typescript
// 현재 (비정규화)
export const layoutNodesAtom = atom([] as CanvasNode[]);
export const layoutLinksAtom = atom([] as Link[]);

// 개선 후 (정규화)
export const graphLayoutAtom = atom({
  nodes: [] as CanvasNode[],
  links: [] as Link[]
});

// 또는 파생 atom 사용
export const layoutLinksAtom = atom((get) => {
  const nodes = get(layoutNodesAtom);
  return computeLinksFromNodes(nodes);
});
```

---

## 7. 성능 문제 (Performance Issues)

### 7.1 불필요한 렌더링 - CanvasConnections
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/widgets/PipelineCanvas/CanvasConnections.tsx`

**문제**:
```typescript
const drawConnections = useCallback(() => { /* 큰 계산 */ }, 
  [layoutLinks, transform.k, transform.x, transform.y, layoutNodes, cardPositions]
);

useEffect(() => {
  const handle = requestAnimationFrame(drawConnections);
  return () => cancelAnimationFrame(handle);
}, [drawConnections]);
```

- drawConnections이 매번 새로 생성되지 않도록 최적화되었지만
- 의존성 배열이 크고, transform 변경 시마다 재계산
- `transform.k` 변경만 필요한 경우 전체 다시 그림

**심각도**: Medium

**제안 개선안**:
```typescript
// 의존성 분리
const drawConnections = useCallback(() => { /* ... */ }, 
  [layoutLinks, layoutNodes] // 정적 데이터만
);

const updateZoom = useCallback(() => { 
  drawConnections(); 
}, [transform.k, drawConnections]);
```

---

### 7.2 extractAllSearchableItems의 반복 AST 파싱
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/features/UnifiedSearch/lib/symbolExtractor.ts` (Line 196-212)

**문제**:
```typescript
// 모든 파일을 다시 파싱
Object.entries(files).forEach(([filePath, content]) => {
  try {
    const sourceFile = ts.createSourceFile(/* ... */);
    // 파싱 반복...
  }
});
```

- 이미 parseProject에서 ts.SourceFile 생성
- extractAllSearchableItems에서 또 생성
- fullNodeMap에 이미 sourceFile 저장됨

**심각도**: Medium

**제안 개선안**:
- fullNodeMap의 sourceFile 재사용
- 파싱 캐싱

---

### 7.3 extractSymbolMetadata의 Language Service 호출
**파일**: `/Users/user/Desktop/vibe-code-viewer/src/shared/symbolMetadataExtractor.ts` (Line 51-111)

**문제**:
```typescript
fullNodeMap.forEach((node) => {
  // 각 노드마다 Language Service 호출
  typeInfo = getQuickInfoAtPosition(/* ... */);
});
```

- 많은 노드에 대해 Language Service 호출
- 각 호출이 파일 해석, 타입 계산 필요
- 동기 작업으로 블로킹 가능

**심각도**: High (큰 프로젝트에서 심각)

**제안 개선안**:
- 배치 처리
- Web Worker 활용
- 캐싱
- 필요한 노드만 처리

---

## 8. FSD 아키텍처 위반

### 8.1 사용되지 않는 index.ts 파일들
**삭제된 파일들** (git status 기준):
- src/app/theme/index.ts
- src/entities/*/index.ts (6개)
- src/features/*/index.ts (3개)
- src/widgets/*/index.ts (3개)

**현재 상태**: CLAUDE.md 규칙 준수 중 (인덱스 파일 없음)

**심각도**: N/A (이미 해결됨)

---

### 8.2 circular import 위험
**파일**: 
- `/Users/user/Desktop/vibe-code-viewer/src/shared/symbolMetadataExtractor.ts`
  - imports: `../widgets/CodeViewer/core/renderer/tsLanguageService`
  - widgets는 shared를 import 할 수 있어 circular 위험

**심각도**: Low (현재는 문제없음, 모니터링 필요)

---

## 9. 개선 우선순위

### Critical Priority
1. **renderCodeLinesDirect 복잡도 감소** - 494줄 함수 분해
2. **과도한 콘솔 로깅 제거** - 로깅 유틸 도입 + 프로덕션 설정
3. **'any' 타입 제거** - 타입 안정성 개선

### High Priority
1. **렌더링 로직 중복 제거** - `useRenderCodeLines` 훅 생성
2. **PipelineCanvas 책임 분리** - 상태 관리 훅으로 분해
3. **CodeLineView 컴포넌트 분해** - 200줄 컴포넌트 축소
4. **extractSymbolMetadata 성능 개선** - 동기->비동기 변경

### Medium Priority
1. **FolderView 로직 분해** - useTree, useFlat 훅 생성
2. **collectFoldMetadata 구조 개선** - 전략 패턴 적용
3. **비정규화 상태 정규화** - layoutNodes/Links 통합
4. **큰 서치 모달 분해** - 서브컴포넌트 분리

### Low Priority
1. **파일 경로 유틸 함수 생성**
2. **Props 개수 최적화** (현재 OK)

### ✅ 완료된 리팩토링
1. **마우스/드래그 이벤트 리스너 패턴 중복 제거** - @use-gesture/react 도입 (2026-01-01)
2. **키보드 이벤트 리스너 패턴 통합** - react-hotkeys-hook 활용 (2026-01-01)
3. **파일 경로 처리 로직 중복 제거** - shared/pathUtils.ts 유틸리티 생성 (2026-01-01)

---

## 10. 추천 리팩토링 순서

### Phase 1 (Week 1): 기초 작업
- [ ] 로깅 유틸 생성 및 적용
- [ ] TypeScript 타입 정확화 (any 제거)
- [ ] 파일 경로 유틸 함수 생성

### Phase 2 (Week 2): 중복 코드 제거
- [ ] `useRenderCodeLines` 훅 생성
- [ ] `useMouseDrag` 훅 생성
- [ ] 렌더링 로직 통합

### Phase 3 (Week 3): 복잡한 함수 분해
- [ ] renderCodeLinesDirect 리팩토링
- [ ] collectFoldMetadata 구조 개선
- [ ] FolderView 로직 분해

### Phase 4 (Week 4): 컴포넌트 재구성
- [ ] CodeLineView 분해
- [ ] PipelineCanvas 책임 분리
- [ ] UnifiedSearchModal 최적화

### Phase 5: 성능 개선
- [ ] extractSymbolMetadata 비동기화
- [ ] 상태 정규화
- [ ] 캐싱 메커니즘 도입

