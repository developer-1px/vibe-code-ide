# TypeScript Language Service - 타입 추론 설정

## 개요

이 프로젝트는 브라우저 환경에서 TypeScript Language Service를 사용하여 코드 분석을 수행합니다. React와 JavaScript 기본 타입을 추론하기 위해 Virtual 타입 정의 파일 시스템을 구축했습니다.

## 구현 내용

### 1. Virtual 타입 파일 시스템 (`src/shared/tsParser/virtual-types/`)

TypeScript lib 파일과 React 타입 정의를 메모리에 로드하여 Language Service가 접근할 수 있도록 함.

**포함된 파일**:
```
virtual-types/
├── index.ts                           # Virtual 파일 export
├── lib.d.ts                            # TypeScript 기본 lib
├── lib.es5.d.ts                        # ES5 기본 타입 (Array, Object, etc.)
├── lib.es2015.d.ts                     # ES2015 lib
├── lib.es2015.core.d.ts                # ES2015 core 타입
├── lib.es2015.promise.d.ts             # Promise 타입
├── lib.es2015.iterable.d.ts            # Iterable 타입
├── lib.es2015.symbol.d.ts              # Symbol 타입
├── lib.es2015.symbol.wellknown.d.ts    # Well-known symbols
├── lib.es2015.generator.d.ts           # Generator 타입
├── lib.es2022.d.ts                     # ES2022 lib
├── lib.dom.d.ts                        # DOM 타입 (HTMLElement, Event, etc.)
├── lib.dom.iterable.d.ts               # DOM Iterable
├── react.d.ts                          # React 타입 정의
└── react-global.d.ts                   # React global 타입
```

**총 크기**: 약 2.3 MB (raw), gzip 후 약 100 KB

### 2. Language Service Host 설정 (`src/shared/tsParser/utils/languageService.ts`)

#### 변경 사항:

**Before**:
```typescript
getCompilationSettings: () => ({
  noLib: true,          // ❌ lib 타입 없음
  noResolve: true,      // ❌ 모듈 해석 안 함
})
```

**After**:
```typescript
// Virtual 타입 파일 통합
const allFiles = { ...virtualTypeFiles, ...files };

getCompilationSettings: () => ({
  noLib: false,                          // ✅ lib 활성화
  lib: ['es2022', 'dom'],                // ✅ 사용할 lib 지정
  noResolve: false,                      // ✅ 모듈 해석 활성화
  moduleResolution: ts.ModuleResolutionKind.Bundler,
})

getScriptFileNames: () => Object.keys(allFiles),  // ✅ Virtual 파일 포함
getDefaultLibFileName: () => '/lib.d.ts',          // ✅ Virtual lib 경로

resolveModuleNames: (moduleNames) => {
  return moduleNames.map((moduleName) => {
    // ✅ 'react' import 해석
    if (moduleName === 'react') {
      return {
        resolvedFileName: '/node_modules/@types/react/index.d.ts',
        extension: ts.Extension.Dts,
        isExternalLibraryImport: true,
      };
    }
    // ... 상대 경로 해석
  });
}
```

### 3. 타입 추론 지원 범위

✅ **JavaScript 기본 타입**:
- `Array`, `Promise`, `Record`, `Map`, `Set`
- `String`, `Number`, `Boolean`, `Object`
- `Date`, `RegExp`, `Error`

✅ **ES2015+ 타입**:
- `Symbol`, `Iterator`, `Generator`
- `Promise.all`, `Promise.race`
- Destructuring, Spread operators

✅ **DOM 타입**:
- `HTMLElement`, `HTMLDivElement`, `HTMLInputElement`
- `MouseEvent`, `KeyboardEvent`, `Event`
- `document`, `window`, `console`

✅ **React 타입**:
- `useState`, `useEffect`, `useCallback`, `useMemo`
- `FC`, `ReactNode`, `JSX.Element`
- Props, State 타입 추론

### 4. 테스트 결과

테스트 스크립트: `scripts/test-type-inference.mjs`

```bash
$ node scripts/test-type-inference.mjs

✅ Virtual 타입 파일 로드 완료
   - 총 14개 파일
   - 총 크기: 2332.63 KB

📝 테스트 1: JavaScript 기본 타입 (Promise, Array)
   ✅ 타입 추론 성공 - 에러 없음

📝 테스트 2: React 타입 (useState, useEffect)
   ✅ 타입 추론 성공 - React 타입 인식됨

📝 테스트 3: DOM 타입 (HTMLElement, Event)
   ✅ 타입 추론 성공 - DOM 타입 인식됨

✅ 모든 테스트 완료!
```

### 5. 번들 크기 영향

**빌드 전**:
- Main bundle: 8,378 KB
- Worker files: ~3,590 KB

**빌드 후** (타입 정의 추가):
- Main bundle: 8,711 KB (+333 KB, +3.8%)
- Worker files: ~3,591 KB (+1 KB, 변화 거의 없음)

**Gzip 압축 후**:
- Main bundle: 2,104 KB (약 +35 KB)

## 사용 예시

### 코드에서 타입 추론 활용

```typescript
import { createLanguageService } from '@/shared/tsParser/utils/languageService';

const files = {
  '/App.tsx': `
    import { useState } from 'react';

    function App() {
      const [count, setCount] = useState(0);
      //     ^^^^^  ^^^^^^^^^
      // 타입 추론: [number, Dispatch<SetStateAction<number>>]

      return <div>{count}</div>;
    }
  `,
};

const languageService = createLanguageService(files);
const program = languageService.getProgram();

// 타입 체크
const diagnostics = languageService.getSemanticDiagnostics('/App.tsx');
console.log('에러 개수:', diagnostics.length);  // 0

// 심볼 정보
const position = 100;  // 'count' 위치
const quickInfo = languageService.getQuickInfoAtPosition('/App.tsx', position);
console.log(quickInfo?.displayParts);  // number 타입 정보
```

## 확장 방법

### 추가 라이브러리 타입 지원

다른 라이브러리(예: react-dom, lodash)의 타입을 추가하려면:

1. **타입 파일 복사**:
```bash
cp node_modules/@types/react-dom/index.d.ts \
   src/shared/tsParser/virtual-types/react-dom.d.ts
```

2. **index.ts에 추가**:
```typescript
import reactDomDts from './react-dom.d.ts?raw';

export const virtualTypeFiles = {
  // ...
  '/node_modules/@types/react-dom/index.d.ts': reactDomDts,
};
```

3. **resolveModuleNames 확장**:
```typescript
resolveModuleNames: (moduleNames) => {
  return moduleNames.map((moduleName) => {
    if (moduleName === 'react-dom') {
      return {
        resolvedFileName: '/node_modules/@types/react-dom/index.d.ts',
        extension: ts.Extension.Dts,
        isExternalLibraryImport: true,
      };
    }
    // ...
  });
}
```

## 주의사항

### 1. 브라우저 환경 제약

- Node.js의 `fs`, `path` 모듈 사용 불가
- 모든 타입 파일을 메모리에 로드해야 함
- 번들 크기 고려 필요

### 2. lib 파일 의존성

TypeScript lib 파일들은 서로 참조 관계가 있음:
```
lib.d.ts
  → lib.es5.d.ts (Array, Object, Promise 등)
  → lib.dom.d.ts (HTMLElement, Event 등)

lib.es2015.d.ts
  → lib.es2015.core.d.ts
  → lib.es2015.promise.d.ts
  → lib.es2015.iterable.d.ts
  → lib.es2015.symbol.d.ts
```

누락 시 "Cannot find name 'Array'" 같은 에러 발생.

### 3. React 타입 외부 의존성

React 타입 정의는 `csstype`, `prop-types`를 참조:
- 현재는 이 의존성 없이 핵심 타입만 동작
- DOM props 타입이 필요하면 추가 고려

## 디버깅

### Language Service가 타입을 못 찾을 때

1. **Virtual 파일이 로드되었는지 확인**:
```typescript
const program = languageService.getProgram();
const libFile = program?.getSourceFile('/lib.es5.d.ts');
console.log('lib.es5.d.ts 로드됨:', !!libFile);
```

2. **모듈 해석 확인**:
```typescript
// resolveModuleNames에 로그 추가
resolveModuleNames: (moduleNames, containingFile) => {
  console.log('[resolveModuleNames]', moduleNames, containingFile);
  // ...
}
```

3. **에러 메시지 확인**:
```typescript
const diagnostics = languageService.getSemanticDiagnostics(fileName);
diagnostics.forEach(d => {
  console.log('타입 에러:', d.messageText);
});
```

## 참고 자료

- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Language Service API](https://github.com/microsoft/TypeScript/wiki/Using-the-Language-Service-API)
- [Monaco Editor 타입 시스템](https://github.com/microsoft/monaco-editor) - CDN에서 타입 파일 동적 로드

## 성능 최적화

### Language Service 캐싱

현재 구현에서는 Language Service를 캐싱하여 재사용:

```typescript
// src/shared/tsParser/utils/languageService.ts

let cachedLanguageService: ts.LanguageService | null = null;
let cachedFilesReference: Record<string, string> | null = null;

export function createLanguageService(files: Record<string, string>) {
  // 동일한 files 객체면 캐시 재사용
  if (cachedLanguageService && cachedFilesReference === files) {
    return cachedLanguageService;
  }

  // 새로 생성
  const host = createLanguageServiceHost(files);
  const languageService = ts.createLanguageService(host, registry);

  cachedLanguageService = languageService;
  cachedFilesReference = files;

  return languageService;
}
```

**주의**: `filesAtom`이 변경되면 `invalidateLanguageService()` 호출 필요.

## 마이그레이션 가이드

기존 코드에서 타입 추론 기능을 사용하려면:

### Before (타입 추론 없음):
```typescript
const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest);
// sourceFile만 가지고 분석
```

### After (타입 추론 사용):
```typescript
import { createLanguageService } from '@/shared/tsParser/utils/languageService';

const languageService = createLanguageService(files);
const program = languageService.getProgram();
const sourceFile = program.getSourceFile(fileName);
const typeChecker = program.getTypeChecker();

// 이제 타입 정보 사용 가능!
const type = typeChecker.getTypeAtLocation(node);
const symbol = typeChecker.getSymbolAtLocation(node);
```

---

**작성일**: 2026-01-06
**최종 테스트**: ✅ 모든 테스트 통과
**빌드 상태**: ✅ 정상 빌드 (+333 KB)
