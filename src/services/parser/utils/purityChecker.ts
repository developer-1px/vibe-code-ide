/**
 * Check if a function is pure (no side effects)
 *
 * Pure functions:
 * - Do not modify external state
 * - Do not call React hooks
 * - Do not perform I/O operations
 * - Return the same output for the same input
 *
 * Impure functions:
 * - Call React hooks (useState, useEffect, useMemo, etc.)
 * - Make API calls (fetch, axios)
 * - Access browser APIs (localStorage, DOM)
 * - Use non-deterministic functions (Math.random, Date.now)
 */

const REACT_HOOKS = [
  'useState',
  'useEffect',
  'useLayoutEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  'useImperativeHandle',
  'useDebugValue',
  'useDeferredValue',
  'useTransition',
  'useId',
  'useSyncExternalStore',
  'useInsertionEffect',
  // Jotai hooks
  'useAtom',
  'useAtomValue',
  'useSetAtom',
  // Custom hooks (start with 'use')
];

const SIDE_EFFECT_PATTERNS = [
  // I/O operations
  'console',
  'alert',
  'confirm',
  'prompt',

  // Browser APIs
  'localStorage',
  'sessionStorage',
  'document',
  'window',
  'navigator',

  // API calls
  'fetch',
  'axios',
  'XMLHttpRequest',

  // Non-deterministic functions
  'Math.random',
  'Date.now',
  'performance.now',

  // DOM manipulation
  'getElementById',
  'querySelector',
  'querySelectorAll',
  'createElement',
  'appendChild',
  'removeChild',
];

// Pure methods that are safe to call (Array, String, Object methods that don't mutate)
const PURE_METHODS = [
  // Array methods (non-mutating)
  'includes',
  'indexOf',
  'lastIndexOf',
  'find',
  'findIndex',
  'filter',
  'map',
  'reduce',
  'reduceRight',
  'some',
  'every',
  'slice',
  'concat',
  'join',
  'flat',
  'flatMap',

  // String methods
  'charAt',
  'charCodeAt',
  'concat',
  'endsWith',
  'includes',
  'indexOf',
  'lastIndexOf',
  'match',
  'padEnd',
  'padStart',
  'repeat',
  'replace',
  'replaceAll',
  'search',
  'slice',
  'split',
  'startsWith',
  'substring',
  'toLowerCase',
  'toUpperCase',
  'trim',
  'trimEnd',
  'trimStart',

  // Object methods (safe)
  'hasOwnProperty',
  'toString',
  'valueOf',

  // Math methods (except random)
  'Math.abs',
  'Math.ceil',
  'Math.floor',
  'Math.round',
  'Math.max',
  'Math.min',
  'Math.sqrt',
  'Math.pow',
];

/**
 * Check if a function AST node is pure
 */
export function isPureFunction(functionNode: any): boolean {
  if (!functionNode || typeof functionNode !== 'object') return true;

  const seen = new Set<any>();
  let hasSideEffect = false;

  const traverse = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    // Check for React hook calls
    if (node.type === 'CallExpression') {
      const calleeName = getCalleeName(node.callee);

      // Check if it's a pure method first (whitelist)
      if (calleeName && PURE_METHODS.some(method => calleeName.endsWith(method))) {
        // This is a safe, pure method - skip
        // Continue traversing without marking as side effect
      } else {
        // Check if it's a React hook
        if (calleeName && REACT_HOOKS.includes(calleeName)) {
          hasSideEffect = true;
          return;
        }

        // Check if it's a custom hook (starts with 'use')
        if (calleeName && /^use[A-Z]/.test(calleeName)) {
          hasSideEffect = true;
          return;
        }

        // Check for side effect patterns
        if (calleeName && SIDE_EFFECT_PATTERNS.some(pattern => calleeName.includes(pattern))) {
          hasSideEffect = true;
          return;
        }
      }
    }

    // Check for member expressions (e.g., console.log, localStorage.setItem)
    if (node.type === 'MemberExpression') {
      const memberPath = getMemberExpressionPath(node);

      // Skip if it's a pure method
      if (PURE_METHODS.some(method => memberPath.endsWith(method))) {
        // This is a safe, pure method - skip
      } else if (SIDE_EFFECT_PATTERNS.some(pattern => memberPath.includes(pattern))) {
        hasSideEffect = true;
        return;
      }
    }

    // Check for assignment to external variables (mutation)
    // Note: This is a simplified check - a proper check would need scope analysis
    if (node.type === 'AssignmentExpression' && node.left?.type === 'MemberExpression') {
      // Assigning to object properties might be a side effect
      // e.g., obj.prop = value
      hasSideEffect = true;
      return;
    }

    // Recursively traverse
    for (const key in node) {
      if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) continue;
      const value = node[key];

      if (Array.isArray(value)) {
        value.forEach(traverse);
      } else if (typeof value === 'object') {
        traverse(value);
      }
    }
  };

  // Start from function body
  if (functionNode.body) {
    traverse(functionNode.body);
  }

  return !hasSideEffect;
}

/**
 * Get the name of a callee (function being called)
 */
function getCalleeName(callee: any): string | null {
  if (!callee) return null;

  if (callee.type === 'Identifier') {
    return callee.name;
  }

  if (callee.type === 'MemberExpression') {
    return getMemberExpressionPath(callee);
  }

  return null;
}

/**
 * Get the full path of a member expression
 * e.g., console.log -> "console.log"
 * e.g., localStorage.setItem -> "localStorage.setItem"
 */
function getMemberExpressionPath(node: any): string {
  const parts: string[] = [];

  const traverse = (n: any) => {
    if (n.type === 'Identifier') {
      parts.unshift(n.name);
    } else if (n.type === 'MemberExpression') {
      if (n.property?.type === 'Identifier') {
        parts.push(n.property.name);
      }
      traverse(n.object);
    }
  };

  traverse(node);
  return parts.join('.');
}
