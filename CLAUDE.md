# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Production build
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Check code with Biome
- `npm run lint:fix` - Auto-fix linting issues (uses `--unsafe` flag)
- `npm run format` - Format code with Biome

### Environment Setup
- Create `.env.local` file with `GEMINI_API_KEY=your_key_here` for AI features
- Development server runs on port 3000

---

## 🚫 CRITICAL RULES

### 1. NO BARREL EXPORTS

**NEVER create index.ts or index.tsx files for re-exporting.**

```typescript
// ❌ NEVER
export * from './model/types';
export { Component } from './ui/Component';

// ✅ ALWAYS - Direct imports
import { FooType } from '@/entities/Foo/model/types';
import { BarComponent } from '@/features/Bar/ui/BarComponent';
```

### 2. AST-ONLY CODE ANALYSIS

**DO NOT use regex for code parsing.**

```typescript
// ❌ NEVER use regex for code analysis
const identifiers = code.match(/\w+/g);

// ✅ ALWAYS use TypeScript Compiler API
import * as ts from 'typescript';
const sourceFile = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest);
```

**Regex is ONLY acceptable for:**
- Path normalization: `replace(/\\/g, '/')`
- Simple string cleanup (not code analysis)

### 3. SINGLE AST TRAVERSAL

**파일당 1번만 파싱! Worker에서 모든 Symbol 수집 완료.**

```typescript
// ✅ CORRECT - Use fullNodeMap filtering
function getSymbols(fullNodeMap: Map<string, SourceFileNode>, filePath: string) {
  return Array.from(fullNodeMap.values()).filter(
    node => node.filePath === filePath && node.type !== 'file'
  );
}

// ❌ WRONG - Don't re-traverse AST (Worker already did it!)
function getSymbols(node: SourceFileNode) {
  ts.forEachChild(node.sourceFile, (child) => { /* NO! */ });
}
```

**Exception:** Usage extraction (non-top-level declarations) requires AST traversal.

### 4. GETTER LAYER PATTERN

**AST와 사용처 사이에 Getter Layer를 두어라.**

```typescript
// ✅ Define getter interface in entities/SourceFileNode/lib/metadata.ts
export function getExports(node: SourceFileNode): ExportInfo[] {
  return extractExportsFromAST(node.sourceFile);
}

// ✅ Use getters + local caching
const fileMetadataList = fileNodes.map(node => ({
  node,
  exports: getExports(node),
  imports: getImports(node),
}));
```

**금지 사항:**
- ❌ SourceFileNode에 metadata 필드 추가 금지
- ❌ Private 함수 직접 호출 금지

### 5. LEGACY CODE - DEPRECATED TYPES

**VariableNode is DEPRECATED. Use SourceFileNode instead.**

```typescript
// ❌ NEVER use
import { VariableNode } from '@/entities/SourceFileNode';

// ✅ ALWAYS use
import { SourceFileNode } from '@/entities/SourceFileNode';
```

**Also deprecated:**
- `GraphNode` - Use `CanvasNode` instead
- `entities/VariableNode/` - Dead code folder

### 6. KEYBOARD SHORTCUTS - SCOPE SYSTEM

**ALWAYS use scope system to prevent conflicts.**

```typescript
// ✅ CORRECT - Unique scope per component
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';

// Static component
useHotkeys('down', handler, {
  scopes: ['sidebar'],
  enabled: focusedPane === 'sidebar'
}, [focusedPane]);

// Dynamic component (modal)
const { enableScope, disableScope } = useHotkeysContext();
useEffect(() => {
  if (isOpen) enableScope('search');
  else disableScope('search');
}, [isOpen]);

useHotkeys('down', handler, {
  scopes: ['search'],
  enabled: isOpen,
  enableOnFormTags: true  // Works in input fields
}, [isOpen, results.length]);
```

**Current scope assignments:**
- `'sidebar'` - File explorer navigation
- `'search'` - Unified search modal
- `'canvas'` - Canvas navigation (future)
- `'ide'` - IDE mode (future)

---

## Project Overview

**Vibe Code Viewer** - A developer tool that visualizes file dependencies and code structure. Parses Vue SFC and React TSX files to create an interactive dependency graph.

### Core Philosophy

코드는 텍스트가 아니라 구조다. 이 프로젝트는:
- 구조를 1급 객체로 다룸 (텍스트는 2급)
- 공간 배치로 기억 (캔버스 > 파일 트리)
- 의미론적 줌 (아키텍처 ↔ 구현)
- 질문 기반 탐색 ("데이터 출처?" > "X 파일 열기")

### Tech Stack

- **React 19** + TypeScript
- **Jotai** - Global state management
- **TypeScript Compiler API** - Code parsing (never regex!)
- **@vue/compiler-sfc** - Vue template parsing
- **D3** - Canvas pan/zoom
- **TailwindCSS 4.x** - Styling with custom LIMN theme
- **Biome** - Linting and formatting (not ESLint/Prettier!)
- **class-variance-authority (CVA)** - Component variant management
- **Feature-Sliced Design (FSD)** - Architecture

---

## Architecture

### State Management - Jotai Atoms

**Key atoms** (`src/store/atoms.ts`):
- `filesAtom` - Virtual file system (Record<string, string>)
- `entryFileAtom` - Entry point for parsing
- `graphDataAtom` - Parsed dependency graph (SourceFileNode[])
- `layoutNodesAtom` - Computed layout positions (CanvasNode[])
- `visibleNodeIdsAtom` - Set of nodes to display
- `transformAtom` - Canvas zoom/pan state
- `foldedLinesAtom` - Code folding state per node
- `searchModalOpenAtom` - Unified search modal (Shift+Shift)
- `documentModeAtom` - Document view mode (IDE/Search tabs)

**Pattern:** Components access atoms directly. NO handler props drilling!

### FSD Layer Rules

```
src/
├── app/              # Application initialization
├── components/       # LIMN Design System (shadcn/ui style) - can be modified
├── entities/         # Domain models (lib, model only - NO ui/)
├── features/         # Business features (lib/ + ui/)
├── widgets/          # Complex UI components
├── shared/           # Shared utilities (tsParser, codeParser, storage)
├── store/            # Global Jotai atoms
├── hooks/            # Custom React hooks
└── styles/           # Global styles (limn.css - LIMN design system)
```

**Important:**
- `entities/` - Pure domain logic, NO UI components
- `features/` - Independent business units with lib/ and ui/
- `components/` - Design system components (LIMN theme), can be modified for project needs
- `styles/limn.css` - Design system tokens and theme definitions

### Features/Entities Organization

**Domain Grouping Pattern** (규모가 커지면서 도메인별 그룹핑 중):

```
features/
├── Code/                    # 도메인 그룹 (Code 관련 features)
│   ├── CodeAnalyzer/
│   │   ├── DeadCodeAnalyzer/
│   │   ├── DeadCodeSelection/
│   │   └── DeadCodePromptCopy/
│   ├── CodeFold/
│   └── FocusMode/
├── File/                    # 도메인 그룹 (File 관련 features)
│   ├── GotoDefinition/
│   ├── Navigation/
│   └── OpenFiles/
├── Search/                  # 도메인 그룹 (Search 관련 features)
│   └── UnifiedSearch/
├── KeyboardShortcuts/       # 독립 feature (도메인 무관)
├── DocumentMode/            # 독립 feature (문서 모드 전환)
└── WorkspacePersistence/    # 독립 feature (도메인 무관)

entities/
├── Code/                    # 향후: Code 관련 entities 그룹
│   ├── CodeLine/
│   ├── CodeSegment/
│   └── CodeFold/
├── SourceFileNode/          # 현재: 독립 entity
├── CanvasNode/              # Canvas rendering
├── CodeSymbol/              # Symbol metadata
└── AppView/                 # View state management
```

**Rules:**
- ✅ 관련 features 3개 이상 → 도메인 폴더로 그룹핑
- ✅ 독립 feature → 최상위에 배치
- ⚠️ 과도기 상태: 점진적으로 도메인 그룹화 중
- 🎯 향후 목표: 모든 features/entities를 도메인별로 그룹핑

### Data Flow

```
User uploads files → filesAtom → useGraphDataInit() → parseProject() in Worker
  → SourceFileNode[] (file nodes + symbol nodes) → useCanvasLayout()
  → layoutNodesAtom (CanvasNode[]) → PipelineCanvas renders
```

### Key Data Structures

**SourceFileNode** (`entities/SourceFileNode/model/types.ts`):
```typescript
interface SourceFileNode {
  id: string;              // filePath for files, "filePath::symbolName" for symbols
  label: string;           // filename or symbol name
  filePath: string;        // full file path
  type: 'file' | 'type' | 'interface' | 'function' | 'const' | 'class' | 'enum';
  codeSnippet: string;     // full file content or symbol declaration
  startLine: number;
  sourceFile?: ts.SourceFile;  // Only for file nodes
  dependencies?: string[];
  vueTemplate?: string;
}
```

**Symbol Node ID Convention:**
```typescript
// File nodes
id: 'src/app/atoms.ts'

// Symbol nodes
id: 'src/app/atoms.ts::DocumentMode'      // type
id: 'src/app/atoms.ts::filesAtom'         // const
id: 'src/app/atoms.ts::parseProject'      // function
```

**CanvasNode** - Extends SourceFileNode with: `x`, `y`, `level`, `visualId`, `isVisible`

### Parser Architecture

**Main entry:** `shared/tsParser/index.ts` → `parseProject()`

**Worker (parseProject.worker.ts) creates:**
1. File nodes (one per file with `ts.SourceFile`)
2. Symbol nodes (type, interface, function, const, class, enum)
3. Dependencies (import paths)

**All in one AST traversal!** Search/analysis only filters `fullNodeMap`, never re-traverses AST.

---

## LIMN Design System

### Design Philosophy

**LIMN** (Light Interface - Minimal Notation) - 따뜻한 색상의 미니멀 디자인 시스템

**Key characteristics:**
- Warm color palette (peach/orange accent colors)
- Dark mode first (with document light mode support)
- Consistent spacing with CSS variables
- Component variants via CVA (class-variance-authority)
- TailwindCSS 4.x with `@theme` directive

### Theme Structure

**Location:** `src/styles/limn.css`

**Design tokens:**
```css
/* Background layers */
--color-bg-deep: #15151d;          /* Deepest background */
--color-bg-base: #181822;          /* Base background */
--color-bg-surface: rgb(28 28 38 / 0.95);  /* Surface level */
--color-bg-elevated: #1c1c26;      /* Elevated surfaces */

/* Warm accent (signature LIMN color) */
--color-warm-300: #ffcc99;         /* Primary accent */
--color-warm-400: rgb(255 200 150 / 0.9);
--color-warm-glow: rgb(255 180 120 / 0.15);  /* Subtle glow effect */

/* Text hierarchy */
--color-text-primary: rgb(255 240 220 / 0.95);
--color-text-secondary: rgb(255 250 245 / 0.7);
--color-text-tertiary: rgb(255 250 245 / 0.55);
--color-text-faint: rgb(255 250 245 / 0.38);

/* Layout dimensions */
--limn-sidebar-width: 240px;
--limn-tab-height: 32px;
--limn-file-item-height: 24px;
```

### Component Patterns

**All components in `src/components/ui/` follow shadcn/ui patterns with LIMN theme:**

```typescript
// ✅ Component with CVA variants
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-1 text-2xs',
  {
    variants: {
      variant: {
        default: 'bg-white/5 text-text-tertiary',
        active: 'bg-warm-glow border border-border-warm text-warm-300',
      },
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

**Component rules:**
- ✅ Use CVA for variant management
- ✅ Extend HTML element props (React.HTMLAttributes)
- ✅ Use `cn()` utility for className merging
- ✅ Interface props allowed (design system exception)
- ❌ NO React.FC

### Document Mode Support

**Light mode for document view** (`[data-doc-mode="light"]`):
- Switched via `documentModeAtom`
- Used in CodeDocView widget
- Clean white background for reading
- Darker accent colors for contrast

---

## Coding Conventions

### Import Rules

```typescript
// ✅ Direct imports - NO file extensions
import { FoldInfo } from '../../../features/CodeFold/lib/types';  // NO .ts
import { Button } from '@/components/ui/Button';  // NO .tsx

// ✅ Relative paths (preferred for features/entities/widgets)
import { atom } from '../../../store/atoms';
import type { CanvasNode } from '../../../../entities/CanvasNode/model/types';

// ✅ @/ Alias allowed ONLY for:
// - components/ (design system)
import { Button } from '@/components/ui/Button';
// - Top-level entry points (App.tsx, main.tsx)
import { ThemeProvider } from '@/entities/AppTheme/ThemeProvider';  // App.tsx only
// - Workers
import type { SourceFileNode } from '@/entities/SourceFileNode/model/types';  // *.worker.ts

// ❌ No @/ alias in features/entities/widgets internal files
import { atom } from '@/store/atoms';  // Wrong! Use relative path
```

**File extensions:**
- ❌ NEVER include `.ts` or `.tsx` in imports
- Vite/TypeScript resolves automatically

### Props Convention

```typescript
// ✅ Inline props - NO separate interface (features/widgets)
const FeatureComponent = ({
  id,
  data
}: {
  id: string;
  data: SomeData;
}) => {
  // Handler는 컴포넌트 내부에서 atom으로 처리
  const setAtom = useSetAtom(someAtom);

  const handleClick = () => {
    setAtom(prev => newState);
  };
};

// ✅ EXCEPTION: components/ui (design system) - interface 허용
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

const Badge = ({ variant, className, ...props }: BadgeProps) => {
  // Design system components use interface for reusability
};

// ❌ NEVER use React.FC (깔끔하지 않음)
const Component: React.FC<Props> = ({ ... }) => { ... }  // NO!
```

**Rules:**
- ✅ Data props - Pass via props
- ❌ Handler props - Use atoms internally (features/widgets만)
- ✅ Interface for data structures (entities/features model/)
- ❌ Interface for component props (features/widgets - inline만)
- ✅ Interface for component props (components/ui - design system)
- ❌ React.FC 사용 금지 (inline props가 더 깔끔)

### TypeScript Rules

```typescript
// ✅ Interface for business data (reusable)
export interface CodeLine {
  num: number;
  segments: CodeSegment[];
  foldInfo?: FoldInfo;
}

// ✅ Component props inline (single use)
const CodeCard = ({ nodeId, lines }: {
  nodeId: string;
  lines: CodeLine[];  // Reuse data interface
}) => { ... };

// ✅ Design system props (reusable)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {}
```

---

## Custom Layout Algorithm

**NOT using D3 force simulation!** Custom tree-based layout in `widgets/PipelineCanvas/useCanvasLayout.ts`:

1. Build visual tree (skip empty nodes, sort by category weight)
2. Compute subtree heights
3. Assign LTR coordinates (X: negative level-based, Y: centered)
4. Handle orphans (visible nodes not in tree)

**Node sorting:** ref(1) → computed(2) → store(3) → hook(4) → call(5) → function(10) → template(30)

---

## Key Features

### Interactive Tokens

- **Token Extraction** (`entities/SourceFileNode/lib/tokenUtils.ts`) - TypeScript Scanner API
- **Segment Building** (`entities/CodeRenderer/lib/segmentUtils.ts`) - CodeSegment[] with types
- **Types:** `dependency` (imports), `local` (variables), `static` (keywords)

**Interactions:**
- Click dependency → expand file
- Click local → highlight usages (Focus Mode)
- Fold/unfold blocks

### Main Content Tab System

**Dynamic tab system for IDE and Search views:**
- `MainContents` widget manages tab state
- IDE mode - Traditional file explorer + canvas
- Search mode - Unified search with preview panel
- Tabs persist with workspace

**Key atoms:**
- `documentModeAtom` - Current tab ('ide' | 'search')
- Controlled by `features/DocumentMode`

### Keyboard Shortcuts

- `Shift + Shift` - Unified search
- `Cmd/Ctrl + K` - Search
- `Cmd/Ctrl + \` - Toggle sidebar
- Arrow keys - File explorer navigation
- Click + drag - Canvas pan
- Scroll - Canvas zoom

---

## Common Workflows

### Adding a new feature

1. Create feature folder: `features/NewFeature/`
2. Add `lib/` for logic and types
3. Add `ui/` for components
4. Define atoms in `features/NewFeature/model/atoms.ts` or `store/atoms.ts`
5. Import directly (no barrel exports!)

### Parsing workflow

1. User uploads → `filesAtom` updated
2. `useGraphDataInit()` triggers `parseProject()` in Worker
3. Worker returns serialized nodes (files + symbols)
4. `App.tsx` reconstructs `ts.SourceFile` for file nodes only
5. `fullNodeMap` populated with all nodes
6. Use getters or filters to extract info (NO AST re-traversal!)

### Adding keyboard shortcuts

1. Check `App.tsx` has `HotkeysProvider`
2. Choose unique scope name
3. Create `useHotkeys{ScopeName}` custom hook (optional but recommended)
4. Use `useHotkeys` with `scopes` option
5. If modal: use `enableScope`/`disableScope` in useEffect
6. Set `enableOnFormTags: true` for input field shortcuts
7. Include all dependencies in 4th parameter array

### Adding design system component

1. Create component in `src/components/ui/{Component}.tsx`
2. Use CVA for variant management
3. Extend appropriate HTML element props
4. Use LIMN theme tokens from `limn.css`
5. Export interface (design system exception)
6. Use `cn()` utility for className merging

---

## Anti-Patterns to Avoid

1. ❌ Barrel exports (index.ts re-exports)
2. ❌ Regex for code analysis (use AST!)
3. ❌ Re-traversing AST (use fullNodeMap filtering)
4. ❌ Handler props drilling (use atoms)
5. ❌ Component props interfaces (use inline, except components/ui)
6. ❌ Using deprecated types (VariableNode, GraphNode)
7. ❌ Hotkeys without scopes (causes conflicts)
8. ❌ Adding metadata fields to SourceFileNode (use getters)
9. ❌ Using ESLint/Prettier (use Biome!)
10. ❌ Hardcoded colors (use LIMN theme tokens)

---

## Reference Documentation

- `CONVENTIONS.md` - Detailed coding conventions
- `README.md` - Project philosophy and vision
- `docs/2-Areas/Architecture/` - Architectural decision records
- TypeScript Compiler API - For AST traversal patterns
- TailwindCSS 4.x docs - For styling patterns
- CVA docs - For component variants

---

## Git Convention

**Commit messages:**
```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:** feat, fix, refactor, docs, style, test, chore

**Language:** 한글로 commit message 작성 (Korean for commits and PR descriptions)

---

## Quick Checklist

**Before committing:**
- [ ] No barrel exports created
- [ ] Component props are inline (features/widgets only - components/ui 예외)
- [ ] Handlers use atoms (not props)
- [ ] No React.FC used (inline props가 더 깔끔)
- [ ] Import paths have NO extensions (.ts, .tsx)
- [ ] Relative paths used (except components/, App.tsx, workers)
- [ ] AST used for code analysis (not regex)
- [ ] Symbol info from fullNodeMap (not re-traversing)
- [ ] Hotkeys have unique scopes
- [ ] Dependencies array properly specified
- [ ] Features 3개 이상 → 도메인 그룹핑 고려
- [ ] Use LIMN theme tokens (not hardcoded colors)
- [ ] Use CVA for component variants (design system)
- [ ] Run `npm run lint:fix` before committing

**If adding TypeScript analysis:**
- [ ] Symbol info needed? → Filter fullNodeMap
- [ ] New symbol type? → Modify Worker extractSymbolNodes()
- [ ] AST traversal? → STOP! Check fullNodeMap first
- [ ] Usage extraction? → OK (exception, not top-level)

**If adding UI component:**
- [ ] Design system component? → Use interface (components/ui)
- [ ] Feature component? → Use inline props (features/)
- [ ] Use CVA for variants? (design system only)
- [ ] Use LIMN theme tokens from limn.css?
- [ ] Extend appropriate HTML element props?
