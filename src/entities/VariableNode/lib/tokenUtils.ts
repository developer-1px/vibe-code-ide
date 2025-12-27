
import { parse } from '@babel/parser';
import { TokenRange } from './types.ts';

const REACT_PRIMITIVES = new Set([
  'useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext', 
  'useReducer', 'useLayoutEffect', 'useImperativeHandle', 'useDebugValue', 
  'useDeferredValue', 'useTransition', 'useId', 'useSyncExternalStore', 'useInsertionEffect'
]);

const VUE_PRIMITIVES = new Set([
  'ref', 'computed', 'reactive', 'watch', 'watchEffect', 
  'onMounted', 'onUnmounted', 'onUpdated', 'onBeforeMount', 
  'onBeforeUnmount', 'onBeforeUpdate', 'provide', 'inject', 
  'toRefs', 'storeToRefs', 'defineProps', 'defineEmits', 
  'defineExpose', 'withDefaults', 'shallowRef', 'triggerRef', 
  'customRef', 'shallowReactive', 'toRef', 'unref', 'isRef', 
  'isProxy', 'isReactive', 'isReadonly', 'readonly'
]);

export const isPrimitive = (name: string) => REACT_PRIMITIVES.has(name) || VUE_PRIMITIVES.has(name);

export const extractTokenRanges = (
    codeSnippet: string,
    nodeId: string,
    dependencies: string[],
    isTemplate: boolean
): TokenRange[] => {
    if (isTemplate) return [];

    const nodeShortId = nodeId.split('::').pop() || '';
    const ranges: TokenRange[] = [];

    try {
        const ast = parse(codeSnippet, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx']
        });

        const visit = (n: any, parent: any) => {
            if (!n || typeof n !== 'object') return;

            if (n.type === 'Identifier') {
                const name = n.name;
                
                const matchedDep = dependencies.find(dep => dep.endsWith(`::${name}`));
                const isSelf = name === nodeShortId;
                const isPrim = isPrimitive(name);
                
                if (isSelf || matchedDep || isPrim) {
                    let type: TokenRange['type'] = 'dependency';
                    if (isSelf) type = 'self';
                    else if (isPrim) type = 'primitive';
                    
                    // Context checks (skip property keys etc)
                    let isValidRef = true;
                    if (parent?.type === 'ObjectProperty' && parent.key === n && !parent.computed && !parent.shorthand) isValidRef = false;
                    if ((parent?.type === 'MemberExpression' || parent?.type === 'OptionalMemberExpression') && parent.property === n && !parent.computed) isValidRef = false;
                    if (parent?.type === 'ObjectMethod' && parent.key === n && !parent.computed) isValidRef = false;
                    
                    // Skip declaration identifiers for primitives (e.g. import { useState } ...)
                    // We only want to highlight usage
                    if (parent?.type === 'ImportSpecifier' && parent.imported === n) isValidRef = false; // "useState" in import { useState }
                    if (parent?.type === 'ImportSpecifier' && parent.local === n) isValidRef = false; // "useState" in import { useState }

                    if (isValidRef) {
                        ranges.push({
                            start: n.start,
                            end: n.end,
                            text: name, 
                            type
                        });
                    }
                }
            }

            Object.keys(n).forEach(key => {
                if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) return;
                const child = n[key];
                if (Array.isArray(child)) child.forEach(c => visit(c, n));
                else if (child && typeof child === 'object') visit(child, n);
            });
        };

        visit(ast.program, null);

    } catch (e) {
        // Fallback or silent fail for syntax errors during typing
    }

    // Deduplicate ranges
    const uniqueRanges: TokenRange[] = [];
    const seenStarts = new Set<number>();
    // Sort needed for linear processing later
    ranges.sort((a, b) => a.start - b.start).forEach(range => {
        if (!seenStarts.has(range.start)) {
            uniqueRanges.push(range);
            seenStarts.add(range.start);
        }
    });

    return uniqueRanges;
};
