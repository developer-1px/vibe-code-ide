# 폴더 구조 리팩토링 제안서

**작성일**: 2026-01-07
**작성자**: Claude
**목적**: FSD(Feature-Sliced Design) 원칙 준수 및 코드 구조 개선

---

## 📋 Executive Summary

현재 프로젝트의 폴더 구조는 FSD 원칙을 부분적으로 위반하고 있으며, 레이어 간 책임이 불명확합니다. 이 문서는 구체적인 문제점을 분석하고, FSD 원칙을 완전히 준수하는 새로운 폴더 구조를 제안합니다.

**주요 개선 효과**:
- ✅ FSD 원칙 완전 준수
- ✅ 레이어별 책임 명확화
- ✅ 코드 중복 제거 (특히 CodeLine 타입)
- ✅ 확장성 향상 (새로운 기능 추가 용이)
- ✅ 테스트 용이성 증가

---

## 🔍 현재 구조의 문제점

### 1. components/ 레이어가 FSD 위반

**문제**:
```
src/components/
├── ide/           ← IDE 관련 위젯들 (TitleBar, StatusBar, Sidebar 등)
└── ui/            ← shadcn/ui 기반 UI 컴포넌트 (Button, Input, Dialog 등)
```

**이유**:
- `components/ide/`는 실제로 **레이아웃 구성 요소**이므로 `app/layouts/`에 위치해야 함
- `components/ui/`는 **재사용 가능한 UI 라이브러리**이므로 `shared/ui/`에 위치해야 함
- FSD에는 `components/` 레이어가 없음 (app, pages, widgets, features, entities, shared만 존재)

**영향도**: 🔴 High
- IDE 레이아웃 관련 코드가 잘못된 위치에 있어 앱 구조 파악이 어려움
- UI 컴포넌트와 레이아웃 컴포넌트가 혼재

---

### 2. features/ 레이어의 일관성 부족

**문제**:
```
src/features/
├── Code/                    ✅ 폴더 구조
├── File/                    ✅ 폴더 구조
├── Search/                  ✅ 폴더 구조
├── CopyAllCodeButton.tsx    ❌ 루트에 파일
├── ResetFilesButton.tsx     ❌ 루트에 파일
├── ResetViewButton.tsx      ❌ 루트에 파일
└── UploadFolderButton.tsx   ❌ 루트에 파일
```

**이유**:
- 일부 기능은 폴더로 구조화되어 있지만, 일부는 루트에 단일 파일로 존재
- 단일 파일 기능도 향후 확장 가능성을 고려하여 폴더 구조로 만들어야 함
- 기능별 그룹핑이 없어 관련 기능을 찾기 어려움

**영향도**: 🟡 Medium
- 새로운 기능 추가 시 어디에 배치할지 혼란
- 관련 기능 간 그룹핑 불가

**제안**:
```
src/features/
├── Workspace/              ✅ NEW - 워크스페이스 관리
│   ├── CopyAllCode/
│   ├── Reset/
│   └── Persistence/
└── File/
    └── Upload/             ✅ MOVED - 파일 업로드
```

---

### 3. entities/ 타입 정의 중복

**문제**:
```
src/entities/CodeLine/model/types.ts              ← 정의 1
src/widgets/CodeViewer/core/types/codeLine.ts    ← 정의 2 (중복!)
```

**이유**:
- 동일한 도메인 모델(`CodeLine`)이 두 곳에 정의됨
- `CodeLine`은 도메인 엔티티이므로 `entities/`에만 있어야 함
- Widget 레이어가 자체 타입을 정의하면 entities와 분리되어 일관성 깨짐

**영향도**: 🔴 High
- 타입 수정 시 두 곳을 모두 업데이트해야 함 (버그 위험)
- Single Source of Truth 원칙 위반

**해결 방법**:
- `widgets/CodeViewer/core/types/codeLine.ts` 삭제
- `entities/CodeLine/model/types.ts`만 사용
- Widget은 entities의 타입을 import하여 사용

---

### 4. widgets/ 구조가 혼재

**문제**:
```
src/widgets/
├── App/              ← App은 widgets가 아님 (app/에 있어야 함)
├── AppTitleBar/      ← 레이아웃 컴포넌트 (app/layouts/에 있어야 함)
├── AppSidebar/       ← 레이아웃 컴포넌트
├── AppStatusBar/     ← 레이아웃 컴포넌트
├── AppActivityBar/   ← 레이아웃 컴포넌트
└── CodeViewer/       ✅ 실제 위젯
```

**이유**:
- `App/`는 애플리케이션 진입점이므로 `app/App.tsx`에 위치
- `AppTitleBar`, `AppSidebar` 등은 **IDE 레이아웃**이므로 `app/layouts/IDELayout/`에 위치
- Widget은 **재사용 가능한 독립적인 UI 블록**이어야 함 (예: CodeViewer, FileExplorer)

**영향도**: 🟡 Medium
- 위젯과 레이아웃 컴포넌트 구분 불명확
- 앱 진입점 찾기 어려움

---

### 5. shared/ 레이어에 비즈니스 로직

**문제**:
```
src/shared/
├── deadCodeAnalyzer.ts         ← 비즈니스 로직 (features로 가야 함)
├── dependencyAnalyzer.ts       ← 도메인 로직 (entities로 가야 함)
├── outlineExtractor.ts         ← 비즈니스 로직 (features로 가야 함)
└── symbolMetadataExtractor.ts  ← 도메인 로직 (entities로 가야 함)
```

**이유**:
- `shared/`는 **재사용 가능한 순수 유틸리티**만 포함해야 함
- **비즈니스 로직**은 `features/`에 위치
- **도메인 로직**은 `entities/`에 위치
- FSD 원칙: shared는 비즈니스 컨텍스트와 무관한 코드만 포함

**영향도**: 🔴 High
- 레이어 간 책임 경계 모호
- shared 레이어가 비대해져서 진짜 공통 유틸 찾기 어려움

**이동 계획**:
- `deadCodeAnalyzer.ts` → `features/Code/DeadCodeAnalysis/lib/`
- `outlineExtractor.ts` → `features/Code/Outline/lib/`
- `dependencyAnalyzer.ts` → `entities/Dependency/lib/`
- `symbolMetadataExtractor.ts` → `entities/CodeSymbol/lib/`

---

### 6. CodeViewer 내부 구조의 책임 분산

**문제**:
```
src/widgets/CodeViewer/core/renderer/lib/
└── languageServiceEnrichers.ts
    ├── enrichWithLanguageService()    # 정의 위치, hover 정보
    └── addInlayHints()                # 파라미터 이름 힌트 (새 기능)
```

**이유**:
- `languageServiceEnrichers.ts`에 **2개의 서로 다른 기능**이 혼재:
  1. 기존: 정의 위치, hover 정보 추가 (렌더링의 일부)
  2. 신규: IntelliJ-style Inlay Hints (독립적인 기능)
- Inlay Hints는 **사용자가 켜고 끌 수 있는 기능**이므로 `features/`에 있어야 함
- 현재는 renderer의 일부로 강제 실행됨

**영향도**: 🟡 Medium
- 향후 다른 종류의 inlay hints 추가 시 파일이 비대해짐
- 기능 토글 불가 (사용자 경험 제한)

**제안**:
```
# Widget에는 순수 렌더링 로직만
src/widgets/CodeViewer/core/
├── renderer/       # AST → CodeLine 변환
├── styler/         # CodeLine → Styled Segments
└── enrichers/      ✅ NEW - LS 기본 기능만
    ├── definitionEnricher.ts
    └── hoverInfoEnricher.ts

# Inlay Hints는 독립 Feature로
src/features/Code/InlayHints/
├── model/atoms.ts           # 토글 상태
├── lib/
│   ├── addInlayHints.ts    # 메인 로직
│   ├── parameterHints.ts   # 파라미터 이름
│   └── typeHints.ts        # (향후) 타입 힌트
└── ui/
    └── InlayHintToggle.tsx # 설정 UI
```

---

## 📐 제안하는 폴더 구조

### 전체 구조 (주요 변경 사항 중심)

```
src/
├── app/                              # Application Layer
│   ├── layouts/                      ✅ NEW - 레이아웃 관리
│   │   ├── IDELayout/               ⬅️ MOVED from components/ide/
│   │   │   ├── IDELayout.tsx
│   │   │   ├── TitleBar.tsx         ⬅️ from components/ide/TitleBar.tsx
│   │   │   ├── ActivityBar.tsx      ⬅️ from components/ide/ActivityBar.tsx
│   │   │   ├── StatusBar.tsx        ⬅️ from components/ide/StatusBar.tsx
│   │   │   └── Sidebar.tsx          ⬅️ from components/ide/Sidebar.tsx
│   │   └── CanvasLayout/
│   │       └── CanvasLayout.tsx
│   ├── providers/                    ✅ NEW - Context Providers
│   │   ├── ThemeProvider.tsx
│   │   ├── EditorThemeProvider.tsx
│   │   └── HotkeysProvider.tsx
│   ├── model/
│   │   ├── atoms.ts                 # Global atoms
│   │   └── store.ts
│   ├── theme/
│   │   ├── default/
│   │   ├── jetbrains/
│   │   ├── vscode/
│   │   └── ...
│   └── App.tsx                       ⬅️ MOVED from widgets/App/
│
├── pages/                            # Pages Layer
│   ├── IDEPage/
│   ├── CanvasPage/
│   └── AnalysisPage/
│
├── widgets/                          # Widgets Layer
│   ├── CodeViewer/                   # ✅ 코드 렌더링 위젯
│   │   ├── core/
│   │   │   ├── renderer/            # AST → CodeLine 변환
│   │   │   │   ├── lib/
│   │   │   │   │   ├── astAnalyzers.ts
│   │   │   │   │   ├── segmentBuilders.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── renderCodeLinesDirect.ts
│   │   │   │   └── ...
│   │   │   ├── styler/              # CodeLine → Styled Segments
│   │   │   └── enrichers/           ✅ NEW - LS 기본 기능
│   │   │       ├── definitionEnricher.ts
│   │   │       └── hoverInfoEnricher.ts
│   │   ├── ui/segments/
│   │   └── CodeViewer.tsx
│   ├── CodeCard/
│   ├── FileExplorer/
│   ├── DeadCodePanel/
│   ├── PipelineCanvas/
│   └── ...
│
├── features/                         # Features Layer
│   ├── Code/
│   │   ├── InlayHints/              ✅ NEW - Inlay Hints 기능
│   │   │   ├── model/
│   │   │   │   └── atoms.ts         # inlayHintsEnabledAtom
│   │   │   ├── lib/
│   │   │   │   ├── addInlayHints.ts        ⬅️ from languageServiceEnrichers
│   │   │   │   ├── parameterHints.ts
│   │   │   │   └── typeHints.ts            # (향후)
│   │   │   └── ui/
│   │   │       └── InlayHintToggle.tsx
│   │   ├── DeadCodeAnalysis/        ⬅️ MOVED from shared/
│   │   │   └── lib/
│   │   │       └── deadCodeAnalyzer.ts
│   │   ├── Outline/                 ⬅️ MOVED from shared/
│   │   │   └── lib/
│   │   │       └── outlineExtractor.ts
│   │   ├── CodeFold/
│   │   └── FocusMode/
│   ├── File/
│   │   ├── Upload/                  ⬅️ MOVED from features/UploadFolderButton.tsx
│   │   │   └── UploadFolderButton.tsx
│   │   ├── GotoDefinition/
│   │   └── ...
│   ├── Workspace/                   ✅ NEW - 워크스페이스 관리
│   │   ├── CopyAllCode/             ⬅️ MOVED from features/CopyAllCodeButton.tsx
│   │   │   └── CopyAllCodeButton.tsx
│   │   ├── Reset/                   ⬅️ MOVED from features/Reset*.tsx
│   │   │   ├── ResetFilesButton.tsx
│   │   │   └── ResetViewButton.tsx
│   │   └── Persistence/
│   │       └── WorkspacePersistence.tsx
│   ├── Search/
│   │   └── UnifiedSearch/
│   └── ...
│
├── entities/                         # Entities Layer
│   ├── SourceFileNode/
│   │   ├── model/types.ts
│   │   ├── lib/
│   │   │   ├── metadata.ts          # Getter Layer
│   │   │   ├── getters.ts
│   │   │   └── tokenUtils.ts
│   │   └── ui/
│   ├── CodeSegment/
│   │   └── model/
│   │       └── types.ts             # InlayHint, SegmentKind
│   ├── CodeLine/
│   │   └── model/
│   │       └── types.ts             # ✅ CodeLine (중복 제거!)
│   ├── CodeSymbol/
│   │   ├── model/types.ts
│   │   └── lib/
│   │       └── symbolMetadataExtractor.ts  ⬅️ MOVED from shared/
│   ├── Dependency/                  ✅ NEW
│   │   ├── model/types.ts
│   │   └── lib/
│   │       └── dependencyAnalyzer.ts       ⬅️ MOVED from shared/
│   └── File/                        ✅ NEW
│       ├── model/types.ts
│       └── lib/
│           └── pathUtils.ts         ⬅️ MOVED from shared/
│
├── shared/                           # Shared Layer
│   ├── ui/                          ⬅️ MOVED from components/ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Dialog.tsx
│   │   ├── TreeView/
│   │   └── ...
│   ├── hooks/
│   │   ├── useAutoScroll.ts
│   │   └── ...
│   ├── lib/
│   │   ├── utils.ts
│   │   └── workerPool.ts
│   ├── api/                         ✅ NEW - API 관련
│   │   └── tsParser/
│   │       ├── parseProject.ts
│   │       ├── utils/
│   │       │   ├── languageService.ts
│   │       │   ├── pathResolver.ts
│   │       │   └── vueExtractor.ts
│   │       └── virtual-types/
│   ├── storage/
│   └── lsif/
│
└── workers/
    ├── codeParser.worker.ts
    └── parseProject.worker.ts
```

---

## 🔄 마이그레이션 단계별 가이드

### Phase 1: 중복 제거 (High Priority)

**목표**: CodeLine 타입 중복 제거

```bash
# 1. entities/CodeLine 확인
src/entities/CodeLine/model/types.ts

# 2. widgets/CodeViewer/core/types/codeLine.ts 삭제
rm src/widgets/CodeViewer/core/types/codeLine.ts

# 3. CodeViewer 내 import 경로 수정
# Before:
import type { CodeLine } from './types/codeLine';

# After:
import type { CodeLine } from '@/entities/CodeLine/model/types';
```

**영향 파일**:
- `src/widgets/CodeViewer/core/renderer/**/*.ts`
- `src/widgets/CodeViewer/ui/**/*.tsx`

---

### Phase 2: shared/ 비즈니스 로직 이동 (High Priority)

#### 2-1. DeadCodeAnalyzer 이동

```bash
# 1. 새 폴더 생성
mkdir -p src/features/Code/DeadCodeAnalysis/lib

# 2. 파일 이동
mv src/shared/deadCodeAnalyzer.ts \
   src/features/Code/DeadCodeAnalysis/lib/deadCodeAnalyzer.ts

# 3. Import 경로 업데이트
# Before:
import { analyzeDeadCode } from '@/shared/deadCodeAnalyzer';

# After:
import { analyzeDeadCode } from '@/features/Code/DeadCodeAnalysis/lib/deadCodeAnalyzer';
```

#### 2-2. OutlineExtractor 이동

```bash
mkdir -p src/features/Code/Outline/lib
mv src/shared/outlineExtractor.ts \
   src/features/Code/Outline/lib/outlineExtractor.ts
```

#### 2-3. SymbolMetadataExtractor → entities

```bash
mkdir -p src/entities/CodeSymbol/lib
mv src/shared/symbolMetadataExtractor.ts \
   src/entities/CodeSymbol/lib/symbolMetadataExtractor.ts
```

#### 2-4. DependencyAnalyzer → entities

```bash
mkdir -p src/entities/Dependency/lib
mv src/shared/dependencyAnalyzer.ts \
   src/entities/Dependency/lib/dependencyAnalyzer.ts
```

#### 2-5. PathUtils → entities

```bash
mkdir -p src/entities/File/lib
mv src/shared/pathUtils.ts \
   src/entities/File/lib/pathUtils.ts
```

---

### Phase 3: InlayHints Feature 분리 (Medium Priority)

#### 3-1. Feature 폴더 생성

```bash
mkdir -p src/features/Code/InlayHints/{model,lib,ui}
```

#### 3-2. Atom 생성

```typescript
// src/features/Code/InlayHints/model/atoms.ts
import { atom } from 'jotai';

export const inlayHintsEnabledAtom = atom(true);
```

#### 3-3. 로직 분리

```typescript
// src/features/Code/InlayHints/lib/parameterHints.ts
import { createLanguageService } from '@/shared/api/tsParser/utils/languageService';

export function getParameterHints(
  codeSnippet: string,
  filePath: string,
  files: Record<string, string>
): Map<number, string> {
  // languageServiceEnrichers.ts의 로직 이동
}
```

```typescript
// src/features/Code/InlayHints/lib/addInlayHints.ts
import { getParameterHints } from './parameterHints';

export function addInlayHints(
  lines: CodeLine[],
  codeSnippet: string,
  filePath: string,
  files: Record<string, string>,
  enabled: boolean
): CodeLine[] {
  if (!enabled) return lines;

  const hints = getParameterHints(codeSnippet, filePath, files);
  return applyHints(lines, hints);
}
```

#### 3-4. Renderer 통합

```typescript
// src/widgets/CodeViewer/core/renderer/renderCodeLinesDirect.ts
import { addInlayHints } from '@/features/Code/InlayHints/lib/addInlayHints';
import { inlayHintsEnabledAtom } from '@/features/Code/InlayHints/model/atoms';
import { store } from '@/app/model/store';

export function renderCodeLinesDirect(...) {
  // ... 기존 로직

  // Inlay Hints 적용
  const inlayHintsEnabled = store.get(inlayHintsEnabledAtom);
  currentLines = addInlayHints(
    currentLines,
    codeSnippet,
    filePath,
    files,
    inlayHintsEnabled
  );

  return currentLines;
}
```

#### 3-5. languageServiceEnrichers.ts 정리

```typescript
// src/widgets/CodeViewer/core/enrichers/definitionEnricher.ts
export const enrichWithLanguageService = (...) => {
  // 기존 enrichWithLanguageService 로직만 남김
};

// addInlayHints는 삭제 (features로 이동 완료)
```

---

### Phase 4: components/ 레이어 제거 (Medium Priority)

#### 4-1. components/ui/ → shared/ui/

```bash
# 1. shared/ui 폴더 확인 (이미 존재)
ls src/shared/ui

# 2. components/ui 내용 복사
cp -r src/components/ui/* src/shared/ui/

# 3. Import 경로 업데이트 (전역 검색/치환)
# Before:
import { Button } from '@/components/ui/Button';

# After:
import { Button } from '@/shared/ui/Button';

# 4. 확인 후 삭제
rm -rf src/components/ui
```

#### 4-2. components/ide/ → app/layouts/IDELayout/

```bash
# 1. 새 폴더 생성
mkdir -p src/app/layouts/IDELayout

# 2. 파일 이동
mv src/components/ide/TitleBar.tsx src/app/layouts/IDELayout/
mv src/components/ide/ActivityBar.tsx src/app/layouts/IDELayout/
mv src/components/ide/StatusBar.tsx src/app/layouts/IDELayout/
mv src/components/ide/Sidebar.tsx src/app/layouts/IDELayout/

# 3. IDELayout.tsx 생성 (레이아웃 조합 컴포넌트)
```

```typescript
// src/app/layouts/IDELayout/IDELayout.tsx
import { TitleBar } from './TitleBar';
import { ActivityBar } from './ActivityBar';
import { StatusBar } from './StatusBar';
import { Sidebar } from './Sidebar';

export const IDELayout = ({ children }) => {
  return (
    <div className="ide-layout">
      <TitleBar />
      <div className="ide-main">
        <ActivityBar />
        <Sidebar />
        <main>{children}</main>
      </div>
      <StatusBar />
    </div>
  );
};
```

#### 4-3. components/ 폴더 삭제

```bash
rm -rf src/components
```

---

### Phase 5: features/ 루트 파일 구조화 (Low Priority)

#### 5-1. Workspace 그룹 생성

```bash
# 1. 폴더 생성
mkdir -p src/features/Workspace/{CopyAllCode,Reset}

# 2. 파일 이동
mv src/features/CopyAllCodeButton.tsx \
   src/features/Workspace/CopyAllCode/CopyAllCodeButton.tsx

mv src/features/ResetFilesButton.tsx \
   src/features/Workspace/Reset/ResetFilesButton.tsx

mv src/features/ResetViewButton.tsx \
   src/features/Workspace/Reset/ResetViewButton.tsx

# 3. Persistence 이동
mv src/features/WorkspacePersistence \
   src/features/Workspace/Persistence
```

#### 5-2. File/Upload 이동

```bash
mkdir -p src/features/File/Upload
mv src/features/UploadFolderButton.tsx \
   src/features/File/Upload/UploadFolderButton.tsx
```

---

### Phase 6: widgets/ 레이아웃 분리 (Low Priority)

#### 6-1. App → app/

```bash
mv src/widgets/App/App.tsx src/app/App.tsx
rm -rf src/widgets/App
```

#### 6-2. AppTitleBar, AppSidebar 등 → app/layouts/

```bash
# 이미 Phase 4에서 처리됨
# 추가로 AppActivityBar, AppStatusBar도 동일하게 처리
```

---

## 📊 마이그레이션 체크리스트

### High Priority (즉시 수행)

- [ ] **Phase 1**: CodeLine 타입 중복 제거
  - [ ] `widgets/CodeViewer/core/types/codeLine.ts` 삭제
  - [ ] Import 경로 수정 (`entities/CodeLine/model/types` 사용)
  - [ ] 빌드 확인

- [ ] **Phase 2**: shared/ 비즈니스 로직 이동
  - [ ] `deadCodeAnalyzer.ts` → `features/Code/DeadCodeAnalysis/`
  - [ ] `outlineExtractor.ts` → `features/Code/Outline/`
  - [ ] `symbolMetadataExtractor.ts` → `entities/CodeSymbol/`
  - [ ] `dependencyAnalyzer.ts` → `entities/Dependency/`
  - [ ] `pathUtils.ts` → `entities/File/`
  - [ ] Import 경로 전역 수정
  - [ ] 빌드 및 타입 체크

### Medium Priority (단계적 수행)

- [ ] **Phase 3**: InlayHints Feature 분리
  - [ ] Feature 폴더 구조 생성
  - [ ] Atom 생성 (`inlayHintsEnabledAtom`)
  - [ ] 로직 분리 (`parameterHints.ts`, `addInlayHints.ts`)
  - [ ] Renderer 통합
  - [ ] `languageServiceEnrichers.ts` 정리
  - [ ] 토글 UI 추가 (선택)

- [ ] **Phase 4**: components/ 레이어 제거
  - [ ] `components/ui/` → `shared/ui/`
  - [ ] `components/ide/` → `app/layouts/IDELayout/`
  - [ ] Import 경로 전역 수정
  - [ ] `components/` 폴더 삭제

### Low Priority (여유 있을 때)

- [ ] **Phase 5**: features/ 루트 파일 구조화
  - [ ] Workspace 그룹 생성 및 파일 이동
  - [ ] File/Upload 이동

- [ ] **Phase 6**: widgets/ 레이아웃 분리
  - [ ] `widgets/App/` → `app/`
  - [ ] 레이아웃 컴포넌트 통합

---

## 🎯 기대 효과

### 1. 코드 구조 명확성
- ✅ 각 레이어의 책임이 명확히 분리
- ✅ 새로운 기능 추가 시 어디에 배치할지 즉시 판단 가능
- ✅ 팀 멤버 간 코드 위치에 대한 합의 자동 형성

### 2. 유지보수성 향상
- ✅ 타입 중복 제거로 Single Source of Truth 확립
- ✅ 비즈니스 로직이 적절한 레이어에 위치하여 수정 범위 명확
- ✅ 레이아웃과 위젯 분리로 UI 변경 영향도 축소

### 3. 확장성 증대
- ✅ InlayHints 같은 새 기능을 독립적으로 추가 가능
- ✅ Feature 토글 시스템 구축 (사용자 설정)
- ✅ 다른 hint 종류 추가 시 폴더만 추가하면 됨

### 4. 테스트 용이성
- ✅ 각 Feature가 독립적이므로 단위 테스트 작성 쉬움
- ✅ Shared 유틸은 비즈니스 로직 없이 순수 함수만 포함
- ✅ Mock 생성 및 의존성 주입 간편

### 5. FSD 표준 준수
- ✅ FSD 커뮤니티 베스트 프랙티스 준수
- ✅ 다른 FSD 프로젝트와 구조 일관성
- ✅ 새로운 개발자 온보딩 시간 단축

---

## 🚨 주의사항

### Import 경로 수정 시

1. **전역 검색/치환 도구 사용**
   - VSCode: `Cmd+Shift+H` (전역 검색/치환)
   - 정규식 사용 권장

2. **타입 체크 필수**
   ```bash
   npm run type-check
   # 또는
   tsc --noEmit
   ```

3. **점진적 마이그레이션**
   - 한 번에 한 Phase씩 진행
   - 각 Phase 완료 후 반드시 빌드 확인
   - Git commit으로 롤백 지점 확보

### 테스트 코드

- 파일 이동 시 테스트 파일도 함께 이동
- Import 경로 수정 후 테스트 실행
- 테스트 실패 시 경로 문제인지 로직 문제인지 확인

---

## 📚 참고 자료

- [Feature-Sliced Design 공식 문서](https://feature-sliced.design/)
- [FSD Best Practices](https://feature-sliced.design/docs/guides/examples)
- [프로젝트 CLAUDE.md](../CLAUDE.md) - FSD 규칙 정의
- [CONVENTIONS.md](../CONVENTIONS.md) - 코딩 컨벤션

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-07 | 1.0 | 초안 작성 | Claude |

---

**다음 단계**: Phase 1 (CodeLine 타입 중복 제거)부터 시작하는 것을 권장합니다.
