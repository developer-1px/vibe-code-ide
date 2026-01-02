# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚫 CRITICAL RULES - NO BARREL EXPORTS

**NEVER create index.ts or index.tsx files for re-exporting.**

Barrel exports are FORBIDDEN in this codebase. They cause:
- ❌ "Go to Definition" navigates to index.ts instead of actual file
- ❌ Symbol search becomes confusing and slow
- ❌ Circular dependency risks
- ❌ Hard to track code flow

**What NOT to do:**
```typescript
// ❌ NEVER create src/entities/Foo/index.ts
export * from './model/types';
export { someFunction } from './lib/utils';

// ❌ NEVER create src/features/Bar/index.ts
export { Component } from './ui/Component';
```

**What TO do:**
```typescript
// ✅ ALWAYS use direct imports
import { FooType } from '@/entities/Foo/model/types';
import { BarComponent } from '@/features/Bar/ui/BarComponent';

// ✅ Or with relative paths
import { FooType } from '../../../entities/Foo/model/types';
import { BarComponent } from '../../features/Bar/ui/BarComponent';
```

**Rules:**
1. ✅ **ALWAYS import from the actual file path**
2. ❌ **NEVER create index.ts for re-exports**
3. ❌ **NEVER use barrel export pattern**
4. ✅ **If you see an index.ts that only re-exports, DELETE it and fix all imports**

## ⚠️ CRITICAL RULES - CODE ANALYSIS

**DO NOT use regular expressions for code parsing or analysis.**

When analyzing JavaScript/TypeScript/Vue/React code:
- ✅ **ALWAYS use TypeScript Compiler API** (`typescript` package) for all code parsing
- ✅ **ALWAYS use `@vue/compiler-sfc`** AST for Vue templates
- ✅ **ALWAYS use AST-based position information** for token highlighting
- ❌ **NEVER use regex patterns** like `/\w+/g`, `match()`, `split()` for code analysis
- ❌ **NEVER use string manipulation** to extract identifiers from code

**Regex is only acceptable for:**
- Path normalization (e.g., `replace(/\\/g, '/')`)
- Simple string cleanup (not code analysis)

**If you find yourself writing regex for code analysis, STOP and use the proper parser instead.**

---

## 🚫 CRITICAL RULES - LEGACY CODE

**VariableNode is DEPRECATED and MUST NOT be used.**

### Forbidden Types (절대 사용 금지)

❌ **NEVER use these types**:
- `VariableNode` - Deprecated, use `SourceFileNode` instead
- `GraphNode` - Unused, use `CanvasNode` instead
- `entities/VariableNode/` - Dead code folder

### Detection Rules

**IF** you see any of these patterns in code:
```typescript
import { VariableNode } from '@/entities/SourceFileNode';
import { VariableNode } from '../entities/SourceFileNode';
const node: VariableNode = ...;
function process(node: VariableNode) { ... }
```

**THEN** immediately:
1. 🚨 **STOP** and warn the user
2. Show this error message:
```
⚠️ CRITICAL: VariableNode is DEPRECATED!

VariableNode は廃止予定です。必ず SourceFileNode を使用してください。

Found: [show the problematic code]
Location: [file:line]

✅ Correct replacement:
[show corrected code with SourceFileNode]

Reason:
- VariableNode has 2 conflicting definitions (confusing!)
- entities/VariableNode/ folder is dead code (0 imports)
- SourceFileNode is the correct, clear name
- Will be removed: 2026-02-01

Details: docs/2-Areas/Architecture/LEGACY_VARIABLENODE_WARNING.md
```

3. Offer to auto-fix:
```
Apply automatic fix? [Yes/No]

If Yes → Replace all VariableNode with SourceFileNode
If No → Explain why this is critical and strongly recommend fixing
```

### Correct Usage

✅ **ALWAYS use**:
```typescript
import { SourceFileNode } from '@/entities/SourceFileNode';

function processFile(node: SourceFileNode) {
  console.log(node.filePath);
  console.log(node.sourceFile); // TypeScript AST
}
```

### Auto-Correction Script

If you detect VariableNode usage, suggest this script to the user:
```bash
# Replace all VariableNode with SourceFileNode
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i '' \
  's/import { VariableNode }/import { SourceFileNode }/g'

find src -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs sed -i '' \
  's/: VariableNode/: SourceFileNode/g'

# Type check
npm run type-check
```

### Code Generation Rules

When generating new code that involves file nodes:

❌ **NEVER generate**:
```typescript
const nodes: VariableNode[] = [];
function process(node: VariableNode) { }
```

✅ **ALWAYS generate**:
```typescript
const nodes: SourceFileNode[] = [];
function process(node: SourceFileNode) { }
```

### Related Documentation

- [LEGACY_VARIABLENODE_WARNING.md](docs/2-Areas/Architecture/LEGACY_VARIABLENODE_WARNING.md) - Full deprecation notice
- [ENTITIES_TYPE_ANALYSIS.md](docs/2-Areas/Architecture/ENTITIES_TYPE_ANALYSIS.md) - Complete type analysis

---

## ⚠️ CRITICAL RULES - KEYBOARD SHORTCUTS

**ALWAYS use scope system for react-hotkeys-hook to prevent conflicts.**

### The Problem: Multiple Components Using Same Keys

When multiple components use the same keyboard shortcuts (e.g., `down`, `up`, `enter`) without scopes, they conflict and neither works properly.

**Common scenario**:
- `FolderView` uses `down`/`up` for file navigation
- `UnifiedSearchModal` uses `down`/`up` for search result navigation
- **Without scopes**: Both try to handle the same keys → conflicts and bugs

### The Solution: Scope System

#### Step 1: HotkeysProvider Setup

**MUST have HotkeysProvider in App.tsx**:
```typescript
import { HotkeysProvider } from 'react-hotkeys-hook';

function App() {
  return (
    <HotkeysProvider initiallyActiveScopes={['sidebar']}>
      <AppContent />
    </HotkeysProvider>
  );
}
```

#### Step 2: Assign Unique Scope to Each Component

**Static component (always active)**:
```typescript
// widgets/AppSidebar/FolderView.tsx
import { useHotkeys } from 'react-hotkeys-hook';

const FolderView = () => {
  useHotkeys('down', () => {
    setFocusedIndex(prev => prev + 1);
  }, {
    scopes: ['sidebar'],              // ✅ Unique scope
    enabled: focusedPane === 'sidebar'
  }, [focusedPane]);

  useHotkeys('up', () => {
    setFocusedIndex(prev => prev - 1);
  }, {
    scopes: ['sidebar'],              // ✅ Unique scope
    enabled: focusedPane === 'sidebar'
  }, [focusedPane]);
};
```

**Dynamic component (modal/conditional)**:
```typescript
// features/UnifiedSearch/ui/UnifiedSearchModal.tsx
import { useHotkeys, useHotkeysContext } from 'react-hotkeys-hook';

const UnifiedSearchModal = () => {
  const [isOpen, setIsOpen] = useAtom(searchModalOpenAtom);

  // Get scope control functions
  const { enableScope, disableScope } = useHotkeysContext();

  // Enable 'search' scope when modal opens
  useEffect(() => {
    if (isOpen) {
      enableScope('search');
      console.log('[UnifiedSearchModal] Enabled search scope');
    } else {
      disableScope('search');
      console.log('[UnifiedSearchModal] Disabled search scope');
    }
  }, [isOpen, enableScope, disableScope]);

  // All hotkeys scoped to 'search'
  useHotkeys('escape', (e) => {
    e.preventDefault();
    handleClose();
  }, {
    scopes: ['search'],               // ✅ Unique scope
    enabled: isOpen,
    enableOnFormTags: true            // Works in input fields
  }, [isOpen]);

  useHotkeys('down', (e) => {
    e.preventDefault();
    setFocusedIndex(prev => Math.min(prev + 1, results.length - 1));
  }, {
    scopes: ['search'],               // ✅ Unique scope
    enabled: isOpen,
    enableOnFormTags: true            // Works in input fields
  }, [isOpen, results.length, setFocusedIndex]);
};
```

### How Scope Isolation Works

**Scope state determines which component's hotkeys are active**:
- Modal closed: `'sidebar'` scope active → FolderView's `down`/`up` work
- Modal open: `'search'` scope active → UnifiedSearchModal's `down`/`up` work
- **No conflicts!** Each scope can independently use the same keys

### enableOnFormTags Option

**When to set `true`**:
```typescript
// ✅ enableOnFormTags: true
// When hotkeys should work even inside input/textarea elements
useHotkeys('escape', handleClose, {
  scopes: ['search'],
  enableOnFormTags: true  // ✅ ESC works even when typing in input
});

useHotkeys('down', handleNavigate, {
  scopes: ['search'],
  enableOnFormTags: true  // ✅ Arrow navigation while searching
});

// ❌ enableOnFormTags: false (default)
// Normal case - let typing have priority
useHotkeys('ctrl+s', handleSave, {
  scopes: ['editor'],
  enableOnFormTags: false  // Don't interfere with form input
});
```

### useHotkeys Signature

```typescript
useHotkeys(
  keys: string,                    // 'down', 'escape', 'ctrl+k', 'shift+shift'
  callback: (e: KeyboardEvent) => void,
  options: {
    scopes?: string[],             // ✅ REQUIRED! Unique scope name
    enabled?: boolean,             // Conditional activation
    enableOnFormTags?: boolean     // Work in input/textarea?
  },
  dependencies: any[]              // ✅ REQUIRED! All values used in callback
);
```

### Dependencies Array (Critical!)

**❌ Missing dependencies causes stale closure bugs**:
```typescript
// ❌ WRONG - Missing dependencies
useHotkeys('down', () => {
  setFocusedIndex(prev => Math.min(prev + 1, results.length - 1));
}, {
  scopes: ['search'],
  enabled: isOpen
});
// Bug: results.length changes won't be seen
```

**✅ Proper dependencies**:
```typescript
// ✅ CORRECT - All values included
useHotkeys('down', () => {
  setFocusedIndex(prev => Math.min(prev + 1, results.length - 1));
}, {
  scopes: ['search'],
  enabled: isOpen,
  enableOnFormTags: true
}, [isOpen, results.length, setFocusedIndex]);
// ✅ Callback always sees latest values
```

### Current Scope Assignments

| Component/Feature | Scope Name | Description |
|-------------------|------------|-------------|
| Sidebar (FolderView) | `'sidebar'` | File explorer keyboard navigation |
| UnifiedSearchModal | `'search'` | Unified search modal |
| CodeCard/Canvas | `'canvas'` | Canvas navigation (future) |
| IDEView | `'ide'` | IDE mode (future) |

### Detection and Enforcement

**IF** you see `useHotkeys` without `scopes`:
```typescript
// ❌ WRONG - No scope specified
useHotkeys('down', handler, { enabled: true });
```

**THEN** immediately:
1. 🚨 **STOP** and warn about potential conflicts
2. Ask: "Which component is this? What scope should it use?"
3. Add appropriate scope from the table above, or create new unique scope
4. If it's a modal/conditional component, add `useHotkeysContext()` and scope lifecycle management

### Custom Scope Hook Pattern (Recommended)

**Naming convention**: `useHotkeys` prefix + scope name → Easy to find in IDE autocomplete

```typescript
// ✅ Recommended pattern: Encapsulate scope options in custom hook
const UnifiedSearchModal = () => {
  const [isOpen, setIsOpen] = useAtom(searchModalOpenAtom);
  const [results, setResults] = useAtom(searchResultsAtom);

  // useHotkeys prefix enables IDE autocomplete
  const useHotkeysSearch = (
    keys: string,
    callback: (e: KeyboardEvent) => void,
    deps: any[]
  ) => {
    useHotkeys(keys, callback, {
      scopes: ['search'],
      enabled: isOpen,
      enableOnFormTags: true
    }, deps);
  };

  // Usage: Concise, no repeated options
  useHotkeysSearch('escape', (e) => {
    e.preventDefault();
    handleClose();
  }, [isOpen]);

  useHotkeysSearch('down', (e) => {
    e.preventDefault();
    setFocusedIndex(prev => Math.min(prev + 1, results.length - 1));
  }, [isOpen, results.length, setFocusedIndex]);
};
```

**Benefits**:
- ✅ Type `useHotkeys` in IDE → `useHotkeysSearch` appears in autocomplete
- ✅ DRY - options defined once, no repetition
- ✅ Prevents accidentally using wrong scope
- ✅ Separates component logic from scope configuration

**Naming convention**:
- `useHotkeysSearch` - Search modal (scope: 'search')
- `useHotkeysSidebar` - Sidebar (scope: 'sidebar')
- `useHotkeysCanvas` - Canvas (scope: 'canvas')

### Checklist for Adding Keyboard Shortcuts

When adding keyboard shortcuts to a component:
- [ ] Is HotkeysProvider set up in App.tsx?
- [ ] Chosen a unique scope name? (check existing scopes)
- [ ] Created `useHotkeys{ScopeName}` custom hook? (recommended)
- [ ] If modal/dynamic component, added scope enable/disable in useEffect?
- [ ] Set `enableOnFormTags: true` for keys that should work in input fields?
- [ ] Included all callback dependencies in 4th parameter array?

### Debugging Tips

**Add console logs to track scope activation**:
```typescript
useEffect(() => {
  if (isOpen) {
    enableScope('search');
    console.log('[ComponentName] Enabled search scope');
  } else {
    disableScope('search');
    console.log('[ComponentName] Disabled search scope');
  }
}, [isOpen, enableScope, disableScope]);

// Test if hotkey is firing
useHotkeys('down', (e) => {
  console.log('[ComponentName] Down key pressed');
  // actual logic
}, {
  scopes: ['search'],
  enabled: isOpen,
  enableOnFormTags: true
}, [isOpen]);
```

**If hotkeys not working, check**:
1. Is the scope currently active? (check console logs)
2. Is `enabled` option true?
3. If in input field, is `enableOnFormTags: true`?
4. Are dependencies up to date?
5. Is another component using same scope? (should be unique!)

### Reference Implementation

See these files for correct patterns:
- `src/App.tsx` - HotkeysProvider setup (src/App.tsx:79)
- `src/features/UnifiedSearch/ui/UnifiedSearchModal.tsx` - Dynamic scope management
- `src/features/UnifiedSearch/ui/SearchResults.tsx` - Scoped hotkeys in feature component
- `src/widgets/Sidebar/FolderView.tsx` - Static scope usage

---

## Project Overview

**Vibe Code Viewer** - A developer tool that visualizes file dependencies and code structure in Vue.js and React projects. The tool parses Vue SFC (Single File Components), React TSX files, and TypeScript files to create an interactive dependency graph using custom tree-based layout (not D3 force simulation).

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Note**: This project integrates with Google's Gemini AI Studio. Set `GEMINI_API_KEY` in `.env.local` for AI features.

## Architecture

### Framework Support

The application supports **both Vue 3 and React 19** projects:
- **All code parsing**: TypeScript Compiler API (`typescript` package)
- **Vue templates**: `@vue/compiler-sfc` for template section extraction
- **Script extraction**: Vue files have their `<script>` content extracted before parsing

### State Management - Jotai Atoms

The application uses **Jotai** for global state management. See `CONVENTIONS.md` for full details on the "no props drilling" pattern.

**Key Atoms** (`src/store/atoms.ts`):
- `filesAtom` - Virtual file system (Record<string, string>)
- `entryFileAtom` - Entry point for parsing
- `graphDataAtom` - Parsed dependency graph (SourceFileNode[])
- `layoutNodesAtom` - Computed layout positions (CanvasNode[])
- `visibleNodeIdsAtom` - Set of nodes to display
- `transformAtom` - Canvas zoom/pan state
- `foldedLinesAtom` - Code folding state per node
- `searchModalOpenAtom` - Unified search modal (Shift+Shift)

**Architecture Pattern**: Feature components access atoms directly instead of receiving handlers via props. Data props are allowed, handler props are forbidden. See `CONVENTIONS.md` for the complete ruleset.

### File-Based Parser (`shared/tsParser/`)

The parser creates **one SourceFileNode per file** with TypeScript Compiler API:

**Main Entry**: `shared/tsParser/index.ts` → `parseProject()`

**Processing Steps**:
1. **File Processing** - Each file becomes one node with `id = filePath`
2. **Vue Extraction** - Extract `<script>` section from `.vue` files
3. **TypeScript Parsing** - Create `ts.SourceFile` via `ts.createSourceFile()`
4. **Import Resolution** - Extract imports, recursively process imported files
5. **Dependency Caching** - Store computed dependencies in `SourceFileNode.dependencies`

**Key Utilities** (moved to `src/shared/tsParser/`):
- `utils/languageService.ts` - Creates TypeScript Language Service for identifier resolution
- `utils/vueExtractor.ts` - Extracts script/template from Vue SFC using `@vue/compiler-sfc`
- `utils/pathResolver.ts` - Resolves relative/alias imports
- `entities/SourceFileNode/lib/getters.ts` - `getDependencies()` extracts import paths from AST

**Important**: The parser stores `ts.SourceFile` in each node. All analysis (token positions, identifiers, etc.) is done via getters that traverse the AST, not by duplicating data structures.

**Note**: Recently migrated from `services/tsParser/` to `shared/tsParser/` and `shared/codeParser.ts` for better FSD compliance.

### Data Flow

```
User uploads files → filesAtom updated → useGraphDataInit() → parseProject()
  → SourceFileNode[] created → useCanvasLayout() computes positions
  → layoutNodesAtom (CanvasNode[]) → PipelineCanvas renders
```

### Key Data Structures

**SourceFileNode** (`entities/SourceFileNode/model/types.ts`):
```typescript
interface SourceFileNode {
  id: string;              // filePath
  label: string;           // filename without extension
  filePath: string;        // full file path
  type: 'module';          // always 'module'
  codeSnippet: string;     // full file content
  startLine: number;       // always 1
  sourceFile: ts.SourceFile;  // TypeScript AST
  dependencies?: string[]; // cached import paths
  vueTemplate?: string;    // Vue template section
}
```

**CanvasNode** (`entities/CanvasNode/model/types.ts`):
- Extends SourceFileNode with layout properties: `x`, `y`, `level`, `visualId`, `isVisible`
- Created by `useCanvasLayout()` custom tree algorithm

### Component Architecture (Feature-Sliced Design)

The codebase follows **Feature-Sliced Design (FSD)** - see `CONVENTIONS.md` for detailed layer rules.

**Key Layers**:
- `entities/` - Domain models (SourceFileNode, CanvasNode, CodeSegment, File)
- `features/` - Business features (CodeFold, FocusMode, UnifiedSearch, WorkspacePersistence, KeyboardShortcuts)
- `widgets/` - Complex UI (Sidebar, PipelineCanvas, CodeCard, CodeViewer, IDEView)
- `shared/` - Shared utilities (tsParser, codeParser, symbolMetadataExtractor, storage)
- `store/` - Global Jotai atoms

**Important Conventions** (from `CONVENTIONS.md`):
1. **No barrel exports** - Direct imports only, no `index.ts` re-exports
2. **No props drilling** - Data via props, handlers via atoms
3. **Inline props types** - No separate interfaces for component props
4. **AST parsing only** - Never use regex for code analysis
5. **Path imports** - Use relative paths (`../../../store/atoms`) instead of `@/` alias (configured but not used by convention)

### Virtual File System

The app operates on an in-memory file system stored in `filesAtom`:
- `DEFAULT_FILES` (loaded from `app/libs/loadExamples.ts`)
- `DEFAULT_ENTRY_FILE`: Entry point for parsing
- Users can upload local folders via `UploadFolderButton`
- **Workspace Persistence**: `features/WorkspacePersistence/` handles saving/loading file system state to browser storage

### View Modes

The application supports two view modes (`viewModeAtom`):
- **Canvas Mode** - Interactive dependency graph with pan/zoom and visual connections
- **IDE Mode** - Traditional code editor view with file explorer

### Theme System

Three built-in editor themes (`currentThemeAtom`):
- `default` - Custom light theme
- `jetbrains` - JetBrains IDE-inspired theme
- `vscode` - VS Code-inspired theme

Themes are implemented using CSS variables in `src/widgets/CodeViewer/core/theme/`
### Custom Layout Algorithm

**NOT using D3 force simulation** - Uses custom tree-based layout algorithm in `widgets/PipelineCanvas/useCanvasLayout.ts`:

**Algorithm Steps**:
1. **Build Visual Tree** (lines 111-203): Creates hierarchical tree from dependency graph
   - Skips nodes with empty code snippets (virtual intermediate nodes)
   - Sorts dependencies by weighted category (imports → local logic → functions → components)
2. **Compute Heights** (lines 209-222): Calculate subtree heights for balanced layout
3. **Assign Coordinates** (lines 230-253): Position nodes in LTR (left-to-right) tree layout
   - X: Negative values, level-based (`-(level * LEVEL_SPACING)`)
   - Y: Centered based on subtree height
4. **Handle Orphans**: Visible nodes not in tree are placed to the right

**Node Sorting** (lines 97-108): Weighted category ordering
```typescript
case 'ref': return 1;
case 'computed': return 2;
case 'store': return 3;
case 'hook': return 4;
case 'call': return 5;
case 'function': return 10;
case 'template': return 30; // Always at bottom
```

### Code Rendering System

The app displays code with **interactive tokens** (clickable identifiers):

**Token Extraction** (`entities/SourceFileNode/lib/tokenUtils.ts`):
- Uses TypeScript Scanner API to extract all tokens from `ts.SourceFile`
- Returns position-based tokens (line, column, text, syntaxKind)

**Segment Building** (`entities/CodeRenderer/lib/segmentUtils.ts`):
- Converts tokens into `CodeSegment[]` with semantic types
- Types: `dependency` (imported identifiers), `local` (local variables), `static` (keywords/literals)

**Interactive Features**:
- Click dependency token → expand that file's code card
- Click local token → highlight all usages in Focus Mode
- Fold/unfold code blocks via `CodeFold` feature

### Key Keyboard Shortcuts

Managed by `features/KeyboardShortcuts/`:
- `Cmd/Ctrl + \` - Toggle sidebar
- `Shift + Shift` (double-tap) - Open unified search modal
- `Cmd/Ctrl + K` - Alternative to open search modal
- File Explorer: Arrow keys + Enter for navigation
- Canvas: Click + drag to pan, scroll to zoom

## Project Structure

```
src/
├── App.tsx                       # Main container
├── main.tsx                      # React entry point
├── store/atoms.ts                # Jotai global state
├── constants.ts                  # Default files
├── app/libs/loadExamples.ts      # Example file loader
├── shared/                       # Shared utilities (FSD)
│   ├── codeParser.ts             # Public API for parsing
│   ├── symbolMetadataExtractor.ts # Extract symbol metadata
│   ├── storage/                  # Browser storage utilities
│   └── tsParser/                 # TypeScript/Vue parser
│       ├── index.ts              # parseProject()
│       └── utils/                # Path resolver, Vue extractor, LanguageService
├── entities/
│   ├── SourceFileNode/           # File node model
│   │   ├── model/types.ts        # SourceFileNode interface
│   │   └── lib/                  # getters, tokenUtils, lineUtils
│   ├── CanvasNode/               # Layout node model
│   ├── File/                     # File entity (fuzzy match, FileItem UI)
│   └── VariableNode/             # ⚠️ DEPRECATED - Do not use
├── features/
│   ├── CodeFold/                 # Code folding logic
│   ├── FocusMode/                # Local variable highlighting
│   ├── UnifiedSearch/            # Shift+Shift search
│   ├── File/                     # File/symbol navigation
│   ├── WorkspacePersistence/     # Save/load workspace state
│   ├── KeyboardShortcuts/        # Global keyboard shortcuts
│   ├── CopyAllCodeButton.tsx     # Copy all code feature
│   ├── ResetFilesButton.tsx      # Reset to default files
│   ├── ResetViewButton.tsx       # Reset canvas view
│   └── UploadFolderButton.tsx    # Upload local folder
├── widgets/
│   ├── Sidebar/                  # File explorer + code view
│   │   ├── Sidebar.tsx
│   │   ├── FileExplorer.tsx
│   │   └── FolderView.tsx
│   ├── PipelineCanvas/           # Canvas rendering (dependency graph)
│   │   ├── PipelineCanvas.tsx
│   │   ├── useCanvasLayout.ts    # Custom tree layout algorithm
│   │   ├── useD3Zoom.ts          # Pan/zoom with D3
│   │   ├── CanvasCodeCard.tsx
│   │   └── CanvasConnections.tsx
│   ├── CodeCard/                 # Code card UI
│   │   ├── CodeCard.tsx
│   │   └── ui/                   # Line, segment, token renderers
│   ├── CodeViewer/               # Code viewer with themes
│   │   ├── CodeViewer.tsx
│   │   ├── core/theme/           # Theme system (default, jetbrains, vscode)
│   │   └── ui/                   # CodeLine, CodeSlot components
│   ├── IDEView/                  # IDE-style view mode
│   ├── LeftSideToolbar/          # Toolbar UI
│   └── MainContent/              # Main content area
└── hooks/useGraphData.ts         # Parse trigger hook
```

## Important Technical Notes

- **TypeScript AST as source of truth**: All code analysis uses `ts.SourceFile`, never regex
- **Getter-based architecture**: Data is extracted on-demand from AST, not duplicated
- **Feature-Sliced Design**: Strict layer separation (entities → features → widgets → shared)
- **No barrel exports**: Always import from exact file paths
- **Inline component props**: No separate prop interfaces
- **Atom-based handlers**: Feature components access atoms directly, not via props
- **Jotai DevTools**: Available in development mode for debugging atom state

## Recent Architectural Changes

**Service Layer Migration** (December 2025 - January 2026):
- Moved `services/tsParser/` → `shared/tsParser/` for better FSD compliance
- Moved `services/codeParser.ts` → `shared/codeParser.ts`
- Moved `services/symbolMetadataExtractor.ts` → `shared/symbolMetadataExtractor.ts`
- `services/` layer being phased out in favor of `shared/` layer

**Theme System Restructure**:
- Consolidated theme packs into unified system under `widgets/CodeViewer/core/theme/`
- Migrated to Tailwind v4 CSS variable system
- Theme imports now use `theme/editor` pattern (not `theme/packs`)

**Type System Cleanup**:
- `VariableNode` deprecated in favor of `SourceFileNode`
- `GraphNode` unused, use `CanvasNode` instead
- See deprecation warnings section above for migration path

## Reference Documentation

- `CONVENTIONS.md` - Complete coding conventions (FSD, no barrel exports, AST-only parsing, inline props)
- `README.md` - Project setup and AI Studio integration
- `docs/2-Areas/Architecture/` - Architectural decision records:
  - `LEGACY_VARIABLENODE_WARNING.md` - VariableNode deprecation notice
  - `ENTITIES_TYPE_ANALYSIS.md` - Complete type system analysis
  - `FSD_LAYER_VIOLATION_ANALYSIS.md` - FSD compliance analysis
  - `CODE_LAYER_DESIGN_ANALYSIS.md` - Code layer design patterns
- TypeScript Compiler API documentation for AST traversal patterns
- git push와 pr은 한글로 쓰기 주석도 한글로 남기기