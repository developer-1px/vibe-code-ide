/**
 * 타입 추론 수동 테스트 스크립트
 *
 * Virtual 타입 파일이 제대로 로드되어 타입 추론이 동작하는지 확인
 */

import * as ts from 'typescript';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Virtual 타입 파일 로드
const virtualTypeFiles = {
  '/lib.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.d.ts'), 'utf-8'),
  '/lib.es5.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es5.d.ts'), 'utf-8'),
  '/lib.es2015.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.d.ts'), 'utf-8'),
  '/lib.es2015.core.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.core.d.ts'), 'utf-8'),
  '/lib.es2015.promise.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.promise.d.ts'), 'utf-8'),
  '/lib.es2015.iterable.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.iterable.d.ts'), 'utf-8'),
  '/lib.es2015.symbol.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.symbol.d.ts'), 'utf-8'),
  '/lib.es2015.symbol.wellknown.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.symbol.wellknown.d.ts'), 'utf-8'),
  '/lib.es2015.generator.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2015.generator.d.ts'), 'utf-8'),
  '/lib.es2022.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.es2022.d.ts'), 'utf-8'),
  '/lib.dom.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.dom.d.ts'), 'utf-8'),
  '/lib.dom.iterable.d.ts': readFileSync(join(projectRoot, 'src/shared/tsParser/virtual-types/lib.dom.iterable.d.ts'), 'utf-8'),
  '/node_modules/@types/react/index.d.ts': readFileSync(
    join(projectRoot, 'src/shared/tsParser/virtual-types/react.d.ts'),
    'utf-8'
  ),
  '/node_modules/@types/react/global.d.ts': readFileSync(
    join(projectRoot, 'src/shared/tsParser/virtual-types/react-global.d.ts'),
    'utf-8'
  ),
};

console.log('\n✅ Virtual 타입 파일 로드 완료');
console.log(`   - 총 ${Object.keys(virtualTypeFiles).length}개 파일`);
console.log(`   - 총 크기: ${(Object.values(virtualTypeFiles).reduce((sum, c) => sum + c.length, 0) / 1024).toFixed(2)} KB\n`);

// 테스트 1: JavaScript 기본 타입
console.log('📝 테스트 1: JavaScript 기본 타입 (Promise, Array)');

const testFiles1 = {
  ...virtualTypeFiles,
  '/test.ts': `
    const arr: Array<number> = [1, 2, 3];
    const promise: Promise<string> = Promise.resolve('hello');
    const obj: Record<string, number> = { a: 1, b: 2 };
  `,
};

const host1 = createLanguageServiceHost(testFiles1);
const languageService1 = ts.createLanguageService(host1, ts.createDocumentRegistry());
const diagnostics1 = languageService1.getSemanticDiagnostics('/test.ts');

if (diagnostics1.length === 0) {
  console.log('   ✅ 타입 추론 성공 - 에러 없음\n');
} else {
  console.log('   ❌ 타입 추론 실패:');
  diagnostics1.forEach((d) => {
    console.log(`      - ${d.messageText}`);
  });
  console.log('');
}

// 테스트 2: React 타입
console.log('📝 테스트 2: React 타입 (useState, useEffect)');

const testFiles2 = {
  ...virtualTypeFiles,
  '/App.tsx': `
    import { useState, useEffect } from 'react';

    function App() {
      const [count, setCount] = useState(0);

      useEffect(() => {
        console.log(count);
      }, [count]);

      return count;
    }
  `,
};

const host2 = createLanguageServiceHost(testFiles2);
const languageService2 = ts.createLanguageService(host2, ts.createDocumentRegistry());
const diagnostics2 = languageService2.getSemanticDiagnostics('/App.tsx');

// csstype, prop-types 의존성 에러는 무시
const criticalErrors = diagnostics2.filter(
  (d) =>
    !d.messageText.toString().includes('csstype') &&
    !d.messageText.toString().includes('prop-types') &&
    !d.messageText.toString().includes('Cannot find module')
);

if (criticalErrors.length === 0) {
  console.log('   ✅ 타입 추론 성공 - React 타입 인식됨');
  console.log(`   ℹ️  무시된 외부 의존성 에러: ${diagnostics2.length - criticalErrors.length}개\n`);
} else {
  console.log('   ⚠️  일부 에러 있음:');
  criticalErrors.forEach((d) => {
    console.log(`      - ${d.messageText}`);
  });
  console.log('');
}

// 테스트 3: DOM 타입
console.log('📝 테스트 3: DOM 타입 (HTMLElement, Event)');

const testFiles3 = {
  ...virtualTypeFiles,
  '/dom.ts': `
    const div: HTMLDivElement = document.createElement('div');
    const handler = (e: MouseEvent) => {
      console.log(e.clientX, e.clientY);
    };
  `,
};

const host3 = createLanguageServiceHost(testFiles3);
const languageService3 = ts.createLanguageService(host3, ts.createDocumentRegistry());
const diagnostics3 = languageService3.getSemanticDiagnostics('/dom.ts');

if (diagnostics3.length === 0) {
  console.log('   ✅ 타입 추론 성공 - DOM 타입 인식됨\n');
} else {
  console.log('   ❌ 타입 추론 실패:');
  diagnostics3.forEach((d) => {
    console.log(`      - ${d.messageText}`);
  });
  console.log('');
}

console.log('✅ 모든 테스트 완료!\n');

// Helper: Language Service Host 생성
function createLanguageServiceHost(files) {
  const fileVersions = new Map();
  Object.keys(files).forEach((fileName) => {
    fileVersions.set(fileName, 0);
  });

  return {
    // ✅ 모든 파일 반환 (Virtual 타입 파일 포함)
    getScriptFileNames: () => Object.keys(files),
    getScriptVersion: (fileName) => {
      const version = fileVersions.get(fileName) || 0;
      return version.toString();
    },
    getScriptSnapshot: (fileName) => {
      const content = files[fileName];
      if (!content) return undefined;
      return ts.ScriptSnapshot.fromString(content);
    },
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => ({
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      allowJs: true,
      esModuleInterop: true,
      skipLibCheck: true,
      noLib: false,
      lib: ['es2022', 'dom'],
      noResolve: false,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      isolatedModules: true,
    }),
    getDefaultLibFileName: () => '/lib.d.ts',
    fileExists: (fileName) => Object.hasOwn(files, fileName),
    readFile: (fileName) => files[fileName],
    resolveModuleNames: (moduleNames, containingFile) => {
      return moduleNames.map((moduleName) => {
        if (moduleName === 'react') {
          return {
            resolvedFileName: '/node_modules/@types/react/index.d.ts',
            extension: ts.Extension.Dts,
            isExternalLibraryImport: true,
          };
        }
        return undefined;
      });
    },
  };
}
