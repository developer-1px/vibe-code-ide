# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL RULES - CODE ANALYSIS

**DO NOT use regular expressions for code parsing or analysis.**

When analyzing JavaScript/TypeScript/Vue code:
- ✅ **ALWAYS use `@babel/parser`** for JavaScript/TypeScript expressions
- ✅ **ALWAYS use `@vue/compiler-sfc`** AST for Vue templates
- ✅ **ALWAYS use AST-based position information** for token highlighting
- ❌ **NEVER use regex patterns** like `/\w+/g`, `match()`, `split()` for code analysis
- ❌ **NEVER use string manipulation** to extract identifiers from code

**Regex is only acceptable for:**
- Path normalization (e.g., `replace(/\\/g, '/')`)
- Simple string cleanup (not code analysis)

**If you find yourself writing regex for code analysis, STOP and use the proper parser instead.**

See `/docs/정규식_분석_보고서.md` for detailed rationale.

---

## Project Overview

**Vue Logic Visualizer** - A developer tool that visualizes variable dependencies and logic pipelines in Vue.js components using D3.js force-directed graphs. The tool parses Vue SFC (Single File Components) and TypeScript files to create an interactive dependency graph.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture

### Core Parsing Pipeline

The application uses a multi-stage parsing pipeline to analyze Vue projects:

1. **Entry Point**: `services/codeParser.ts` - Entry function `parseVueCode()`
2. **Project Parser**: `services/parser/ProjectParser.ts` - Main orchestrator that:
   - Processes files recursively starting from entry file
   - Uses `@vue/compiler-sfc` to parse `.vue` files (extracts script and template)
   - Uses `@babel/parser` to parse JavaScript/TypeScript AST
   - Tracks imports/exports across files
   - Builds dependency graph of variables, composables, and components
3. **AST Utilities**: `services/parser/astUtils.ts` - Helper functions for traversing AST nodes
4. **Path Resolution**: `services/parser/pathUtils.ts` - Resolves import paths and finds files in the virtual file system

### Data Flow

```
User edits code → App.tsx (useMemo trigger) → parseVueCode() → ProjectParser
  → Graph nodes created → PipelineCanvas renders D3 force simulation
```

### Key Data Structures

- **VariableNode** (`entities/VariableNode/`): Represents a node in the dependency graph
  - `id`: Unique identifier (format: `filePath::localName`)
  - `label`: Display name
  - `filePath`: Source file path
  - `type`: Node category (`module`, `composable`, `computed`, `ref`, etc.)
  - `sourceLineNum`: Line number in source file
  - `dependencies`: Array of node IDs this node depends on

- **GraphData**: Container for the parsed graph
  ```typescript
  { nodes: VariableNode[] }
  ```

### Component Architecture

- **App.tsx**: Main container managing:
  - Virtual file system state (`files`)
  - Active file selection
  - Sidebar toggle (Cmd/Ctrl + \\)
  - Parse error handling with fallback to last valid graph

- **Sidebar.tsx**: Code editor interface with file tabs

- **PipelineCanvas.tsx**: D3.js visualization container
  - **useCanvasLayout.ts**: D3 force simulation for node positioning
  - **useD3Zoom.ts**: Pan and zoom behavior
  - **CanvasConnections.tsx**: Renders dependency arrows between nodes
  - **CanvasBackground.tsx**: Grid background

### Virtual File System

The app operates on an in-memory file system defined in `constants.ts`:
- `DEFAULT_FILES`: Record of file paths to source code strings
- `DEFAULT_ENTRY_FILE`: Starting point for parsing (`src/pages/MarketplaceIndex.vue`)
- Files can be edited in the UI and changes trigger re-parsing

## Important Technical Details

### Path Alias Configuration

- `@/*` maps to project root (configured in `vite.config.ts` and `tsconfig.json`)
- The parser must handle various import formats:
  - Relative: `./component.vue`, `../utils.ts`
  - Alias: `@/components/Button.vue`
  - Nuxt-style: `~~/layers/...` (mapped to `src/`)

### Environment Variables

- `GEMINI_API_KEY` must be set in `.env.local` for AI-powered explanations
- Vite exposes this as `process.env.GEMINI_API_KEY` via the config

### Parser Node Types

The parser categorizes variables into types:
- `module`: Imported components/functions
- `composable`: Composable functions (e.g., `useFetch...`)
- `computed`: Vue computed properties
- `ref`: Vue refs
- `reactive`: Vue reactive objects
- `function`: Regular functions
- `const`: Constants
- `let`/`var`: Mutable variables

### Template Analysis

Vue template parsing (in `ProjectParser.ts`):
- Extracts component usage from `<template>` section
- Links template component references to script imports
- Tracks which components are actually used vs just imported

## Project Structure

```
/
├── App.tsx                    # Main application container
├── index.tsx                  # React entry point
├── constants.ts               # Default Vue project files for demo
├── types.ts                   # Shared type definitions
├── components/
│   ├── Sidebar.tsx           # Code editor UI
│   └── PipelineCanvas/       # D3 visualization components
├── services/
│   ├── codeParser.ts         # Public parsing API
│   ├── geminiService.ts      # AI explanation integration
│   └── parser/               # Core parsing logic
│       ├── ProjectParser.ts  # Main parser class
│       ├── astUtils.ts       # AST traversal helpers
│       └── pathUtils.ts      # Import path resolution
└── entities/
    └── VariableNode/         # Graph node entity and types
```

## Development Notes

- The parser builds a dependency graph where edges represent "depends on" relationships
- Error handling: If parsing fails, the UI displays last valid graph with error indicator
- The force simulation in D3 automatically positions nodes to minimize edge crossings
- Keyboard shortcut: `Cmd/Ctrl + \` toggles the sidebar visibility