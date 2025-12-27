
import { GraphData, VariableNode } from '../../entities/VariableNode';
import { parse as parseSFC } from '@vue/compiler-sfc';
import { parse as parseBabel } from '@babel/parser';
import { resolvePath, findFileInProject, findFileByName } from './pathUtils.ts';
import { extractIdentifiersFromPattern, findDependenciesInAST } from './astUtils.ts';
import { parseVueTemplate } from './vueTemplateParser.ts';
import { parseTsxComponent } from './tsxParser.ts';

// Framework primitives to exclude from dependency graph
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

const IS_PRIMITIVE = (name: string) => REACT_PRIMITIVES.has(name) || VUE_PRIMITIVES.has(name);

export class ProjectParser {
  private files: Record<string, string>;
  private nodes: Map<string, VariableNode> = new Map(); // Key: filePath::localName
  private processedFiles: Set<string> = new Set();
  
  // To link imports to exports
  // Map<FilePath, Map<ExportName, NodeID>>
  private exportsRegistry: Map<string, Map<string, string>> = new Map();

  constructor(files: Record<string, string>) {
    this.files = files;
  }

  public parseProject(entryFile: string): GraphData {
    this.processFile(entryFile);
    return {
      nodes: Array.from(this.nodes.values())
    };
  }

  private parseVueFile(content: string) {
    const { descriptor } = parseSFC(content);

    const scriptContent = descriptor.scriptSetup?.content || descriptor.script?.content || '';
    const startLineOffset = (descriptor.scriptSetup?.loc.start.line || descriptor.script?.loc.start.line || 1) - 1;

    if (!descriptor.template) {
        return { scriptContent, templateContent: null, templateAst: null, templateStartLine: 0, startLineOffset, templateContentOffset: 0 };
    }

    const templateAst = descriptor.template.ast;

    // We want to include the <template> tags in the snippet.
    // descriptor.template.content gives only inner content.
    // descriptor.template.loc.start.offset gives the start of inner content.
    
    const contentStart = descriptor.template.loc.start.offset;
    const contentEnd = descriptor.template.loc.end.offset;

    // Find start of <template> tag by searching backwards
    let tagStart = content.lastIndexOf('<template', contentStart);
    if (tagStart === -1) tagStart = contentStart;

    // Find end of </template> tag by searching forwards
    const closeTag = '</template>';
    let tagEnd = content.indexOf(closeTag, contentEnd);
    if (tagEnd !== -1) {
        tagEnd += closeTag.length;
    } else {
        tagEnd = contentEnd;
    }

    // Extract the full block including tags
    const templateSnippet = content.substring(tagStart, tagEnd);
    
    // Calculate start line of the tag (1-based)
    const templateStartLine = content.substring(0, tagStart).split('\n').length;
    
    // The offset to use for relative token calculations (start of the snippet)
    const templateContentOffset = tagStart;

    console.log('📋 Template offset info:');
    console.log('   tagStart:', tagStart);
    console.log('   tagEnd:', tagEnd);
    console.log('   snippet length:', templateSnippet.length);

    return { scriptContent, templateContent: templateSnippet, templateAst, templateStartLine, startLineOffset, templateContentOffset };
  }

  private processVueTemplate(filePath: string, templateContent: string | null, templateAst: any, templateStartLine: number, templateContentOffset: number): string | null {
    if (!templateContent || !templateAst) return null;

    const templateId = `${filePath}::TEMPLATE_ROOT`;

    // Get all variables defined in this file
    const fileVars = Array.from(this.nodes.values()).filter(n => n.filePath === filePath);
    const fileVarNames = new Set(fileVars.map(n => n.id.split('::').pop()!));

    // Parse template using dedicated parser (adjust offsets to be relative to templateContent)
    const parseResult = parseVueTemplate(templateAst, fileVarNames, templateContentOffset);

    console.log('🔍 Template Parse Result:', filePath);
    console.log('   dependencies:', parseResult.dependencies);
    console.log('   tokenRanges:', parseResult.tokenRanges.length, 'ranges');

    const fileName = filePath.split('/').pop() || 'Component';
    const templateNode: VariableNode = {
         id: templateId,
         label: `${fileName} <template>`,
         filePath,
         type: 'template',
         codeSnippet: templateContent, // Don't trim! AST offsets are based on original content
         startLine: templateStartLine,
         dependencies: parseResult.dependencies.map(name => `${filePath}::${name}`),
         templateTokenRanges: parseResult.tokenRanges.map(range => ({
             ...range,
             tokenIds: range.tokenIds.map((name: string) => `${filePath}::${name}`)
         }))
    };

    this.nodes.set(templateId, templateNode);
    return templateId;
  }

  private processReactJSX(filePath: string, ast: any, scriptContent: string): string | null {
    // Get all variables defined in this file
    const fileVars = Array.from(this.nodes.values()).filter(n => n.filePath === filePath);
    const fileVarNames = new Set(fileVars.map(n => n.id.split('::').pop()!));

    console.log('📋 fileVarNames for', filePath, ':', Array.from(fileVarNames));

    // Parse entire TSX file to find dependencies (we still need this for linking)
    const parseResult = parseTsxComponent(ast, fileVarNames);

    console.log('🔍 TSX Parse Result:', filePath);
    console.log('   dependencies:', parseResult.dependencies);
    
    // --- EXTRACT JSX SNIPPET ---
    // Instead of showing the whole file, we try to find the main return statement with JSX
    let jsxSnippet = scriptContent;
    let jsxStartLine = 1;
    let snippetStartOffset = 0; // The absolute offset where the snippet starts in the original file

    // Helper to traverse and find JSX return with cycle detection
    const findJSXReturn = (node: any, seen = new Set<any>()) => {
        if (!node || typeof node !== 'object') return null;
        if (seen.has(node)) return null;
        seen.add(node);

        if (node.type === 'ReturnStatement') {
            const arg = node.argument;
            if (arg) {
                // Case 1: return <div...
                if (arg.type === 'JSXElement' || arg.type === 'JSXFragment') {
                    return arg;
                }
                // Case 2: return ( <div... )
                if (arg.type === 'ParenthesizedExpression' && 
                   (arg.expression.type === 'JSXElement' || arg.expression.type === 'JSXFragment')) {
                    return arg.expression; // Return inner expression to get tighter line bounds
                }
            }
        }

        for (const key in node) {
             if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) continue;
             const value = node[key];
             if (Array.isArray(value)) {
                 for (const item of value) {
                     const result: any = findJSXReturn(item, seen);
                     if (result) return result;
                 }
             } else if (typeof value === 'object') {
                 const result: any = findJSXReturn(value, seen);
                 if (result) return result;
             }
        }
        return null;
    };

    const jsxNodeFound = findJSXReturn(ast);

    if (jsxNodeFound && jsxNodeFound.loc) {
        const startLine = jsxNodeFound.loc.start.line;
        const endLine = jsxNodeFound.loc.end.line;

        // Calculate offset of the start of the line (preserve indentation)
        let currentOffset = 0;
        for (let i = 1; i < startLine; i++) {
             const nextNewline = scriptContent.indexOf('\n', currentOffset);
             if (nextNewline === -1) break;
             currentOffset = nextNewline + 1;
        }
        snippetStartOffset = currentOffset;

        // Calculate offset of the end of the end line
        let endOffset = currentOffset;
        for (let i = startLine; i <= endLine; i++) {
             const nextNewline = scriptContent.indexOf('\n', endOffset);
             if (nextNewline === -1) {
                 endOffset = scriptContent.length;
                 break;
             }
             if (i === endLine) {
                 endOffset = nextNewline; // Stop before newline of last line
             } else {
                 endOffset = nextNewline + 1;
             }
        }
        
        jsxSnippet = scriptContent.substring(snippetStartOffset, endOffset);
        jsxStartLine = startLine;

        console.log('✨ Extracted JSX Snippet:', jsxSnippet.length, 'chars, starting line', jsxStartLine);
    } else {
        console.log('⚠️ No specific JSX return found, using full file content');
    }

    const jsxId = `${filePath}::JSX_ROOT`;
    const snippetEndOffset = snippetStartOffset + jsxSnippet.length;

    // Check if we have statement nodes for this file (from React component processing)
    const statementNodes = Array.from(this.nodes.values()).filter(
      n => n.filePath === filePath && n.id.includes('_stmt_')
    );

    // FIX: Dependencies must include BOTH internal logic (statements) AND external references (JSX deps)
    const statementIds = statementNodes.map(n => n.id);
    const jsxRefIds = parseResult.dependencies.map(name => `${filePath}::${name}`);

    // Merge and deduplicate
    const dependencies = Array.from(new Set([...statementIds, ...jsxRefIds]));

    const fileName = filePath.split('/').pop() || 'Component';
    const jsxNode: VariableNode = {
      id: jsxId,
      label: `${fileName} (View)`,
      filePath,
      type: 'template',
      codeSnippet: jsxSnippet,
      startLine: jsxStartLine,
      dependencies,
      // Adjust token ranges to be relative to the extracted snippet
      templateTokenRanges: parseResult.tokenRanges
        .filter(range => range.startOffset >= snippetStartOffset && range.endOffset <= snippetEndOffset)
        .map(range => ({
            ...range,
            startOffset: range.startOffset - snippetStartOffset,
            endOffset: range.endOffset - snippetStartOffset,
            tokenIds: range.tokenIds.map((name: string) => `${filePath}::${name}`)
        }))
    };

    this.nodes.set(jsxId, jsxNode);
    console.log('📦 JSX_ROOT depends on', dependencies.length, 'nodes');

    // FIX: Link Component nodes (PascalCase functions) to JSX_ROOT
    // This ensures that "UserList" component node depends on its View (JSX_ROOT).
    const potentialComponents = Array.from(this.nodes.values()).filter(n => 
        n.filePath === filePath && 
        n.id !== jsxId &&
        n.type !== 'module' &&
        n.type !== 'template' &&
        !n.id.includes('_stmt_')
    );

    potentialComponents.forEach(node => {
        const name = node.label;
        // Check if PascalCase (heuristic for components)
        if (name && name.length > 0 && name[0] === name[0].toUpperCase()) {
            if (!node.dependencies.includes(jsxId)) {
                node.dependencies.push(jsxId);
                console.log(`🔗 Linked Component ${name} to JSX_ROOT`);
            }
        }
    });

    return jsxId;
  }

  private processFileRoot(filePath: string, scriptContent: string, localDefs: Set<string>, ast: any): string {
    const fileRootId = `${filePath}::FILE_ROOT`;

    // Get all nodes defined in this file (except FILE_ROOT itself)
    const fileNodes = Array.from(this.nodes.values())
      .filter(n => n.filePath === filePath && n.id !== fileRootId);
    const dependencies = fileNodes.map(n => n.id);

    // Extract token ranges for all variable references in the file
    const tokenRanges = this.extractTokenRangesFromCode(scriptContent, localDefs, ast);

    // Convert local names to full IDs in tokenRanges
    const processedTokenRanges = tokenRanges.map(range => ({
      ...range,
      tokenIds: range.tokenIds.map((name: string) => `${filePath}::${name}`)
    }));

    const fileName = filePath.split('/').pop() || 'File';
    const fileRootNode: VariableNode = {
      id: fileRootId,
      label: `${fileName}`,
      filePath,
      type: 'module',
      codeSnippet: scriptContent,
      startLine: 1,
      dependencies,
      templateTokenRanges: processedTokenRanges
    };

    this.nodes.set(fileRootId, fileRootNode);
    console.log('📄 Created FILE_ROOT for:', filePath, 'with', dependencies.length, 'dependencies');
    return fileRootId;
  }

  private extractTokenRangesFromCode(code: string, localDefs: Set<string>, ast: any): any[] {
    const tokenRanges: any[] = [];
    const addedPositions = new Set<string>(); // Track added positions to avoid duplicates
    const seen = new Set<any>(); // Cycle protection

    // Traverse the entire AST and find all identifier references
    const traverse = (node: any, parent: any = null) => {
      if (!node || typeof node !== 'object') return;
      if (seen.has(node)) return;
      seen.add(node);

      if (node.type === 'Identifier') {
        const name = node.name;

        // Skip keywords
        if (['true', 'false', 'null', 'undefined', 'this'].includes(name)) return;

        // Skip object keys in non-computed properties
        if (parent?.type === 'ObjectProperty' && parent.key === node && !parent.computed && !parent.shorthand) return;

        // Skip property access in non-computed member expressions
        if ((parent?.type === 'MemberExpression' || parent?.type === 'OptionalMemberExpression') &&
            parent.property === node && !parent.computed) return;

        // Check if this is a local definition
        if (localDefs.has(name)) {
          const posKey = `${node.start}-${node.end}`;
          if (!addedPositions.has(posKey)) {
            addedPositions.add(posKey);
            tokenRanges.push({
              startOffset: node.start,
              endOffset: node.end,
              text: name,
              tokenIds: [name]  // Will be converted to full ID later
            });
          }
        }
      }

      // Recursively traverse
      for (const key in node) {
        if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) continue;
        const value = node[key];

        if (Array.isArray(value)) {
          value.forEach(v => traverse(v, node));
        } else if (typeof value === 'object') {
          traverse(value, node);
        }
      }
    };

    traverse(ast);

    console.log('📍 Extracted', tokenRanges.length, 'token ranges from file');
    return tokenRanges;
  }

  private ensureDefaultExport(filePath: string, templateId: string | null) {
    const defaultId = `${filePath}::default`;

    // If explicit export default wasn't found (e.g. script setup), create a synthetic node
    if (!this.nodes.has(defaultId)) {
         this.nodes.set(defaultId, {
            id: defaultId,
            label: filePath.split('/').pop() || 'Component',
            filePath,
            type: 'module',
            codeSnippet: '', // Virtual node
            startLine: 0,
            dependencies: []
         });
    }

    const defaultNode = this.nodes.get(defaultId)!;
    // The Component (Default Export) depends on the Template (Visual Structure)
    // This ensures when you expand "Import X", you see the Template of X.
    if (templateId && !defaultNode.dependencies.includes(templateId)) {
        defaultNode.dependencies.push(templateId);
    }
  }

  private processFile(filePath: string) {
    if (this.processedFiles.has(filePath)) return;
    this.processedFiles.add(filePath);

    const content = this.files[filePath];
    if (!content) return;

    const isVue = filePath.endsWith('.vue');
    const parseResult = isVue ? this.parseVueFile(content) : {
        scriptContent: content,
        templateContent: null,
        templateAst: null,
        templateStartLine: 0,
        startLineOffset: 0,
        templateContentOffset: 0
    };

    const { scriptContent, templateContent, templateAst, templateStartLine, startLineOffset, templateContentOffset } = parseResult;

    try {
        const isTsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');
        const ast = parseBabel(scriptContent, {
            sourceType: 'module',
            plugins: isTsx ? ['typescript', 'jsx'] : ['typescript']
        });

        const localDefs = new Set<string>(); // Variables defined in this file

        // 1. Scan Imports First (and recurse)
        ast.program.body.forEach((node: any) => {
            if (node.type === 'ImportDeclaration') {
                const source = node.source.value;
                const resolvedPath = resolvePath(filePath, source);
                const targetFile = (resolvedPath && findFileInProject(this.files, resolvedPath)) ||
                                   (source && findFileByName(this.files, source)) ||
                                   null;

                if (targetFile) {
                    // Recurse
                    this.processFile(targetFile);
                    
                    // Map imports
                    node.specifiers.forEach((spec: any) => {
                        if (spec.type === 'ImportSpecifier') {
                            const importedName = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
                            const localName = spec.local.name;
                            
                            // Check if imported item is a primitive (re-export edge case or named import)
                            if (IS_PRIMITIVE(importedName)) return;

                            // Construct ID of the remote node
                            const remoteId = `${targetFile}::${importedName}`;
                            
                            // Default export handling
                            const remoteDefaultId = `${targetFile}::default`;
                            const finalRemoteId = importedName === 'default' ? remoteDefaultId : remoteId;
                            
                            const importNodeId = `${filePath}::${localName}`;
                            this.nodes.set(importNodeId, {
                                id: importNodeId,
                                label: localName,
                                filePath,
                                type: 'module',
                                codeSnippet: `import { ${importedName} } from '${source}'`,
                                startLine: node.loc.start.line + startLineOffset,
                                dependencies: [finalRemoteId] // Always add dependency to enable cross-file linking
                            });
                            
                            localDefs.add(localName);
                        } else if (spec.type === 'ImportDefaultSpecifier') {
                             const localName = spec.local.name;
                             const remoteDefaultId = `${targetFile}::default`;
                             
                             const importNodeId = `${filePath}::${localName}`;
                             this.nodes.set(importNodeId, {
                                id: importNodeId,
                                label: localName,
                                filePath,
                                type: 'module',
                                codeSnippet: `import ${localName} from '${source}'`,
                                startLine: node.loc.start.line + startLineOffset,
                                dependencies: [remoteDefaultId] 
                             });
                             localDefs.add(localName);
                        }
                    });
                } else {
                    // External import
                    node.specifiers.forEach((spec: any) => {
                         const localName = spec.local.name;
                         
                         // Check imported name for named imports
                         let importedName = localName;
                         if (spec.type === 'ImportSpecifier') {
                             importedName = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
                         }
                         
                         // Skip node creation for primitives
                         if (IS_PRIMITIVE(importedName)) return;

                         const importNodeId = `${filePath}::${localName}`;
                         this.nodes.set(importNodeId, {
                             id: importNodeId,
                             label: localName,
                             filePath,
                             type: 'module',
                             codeSnippet: `import ... from '${source}'`,
                             startLine: node.loc.start.line + startLineOffset,
                             dependencies: []
                         });
                         localDefs.add(localName);
                    });
                }
            }
        });

        // 2. Scan Top Level Declarations
        const fileExports = new Map<string, string>(); // exportName -> nodeId

        ast.program.body.forEach((node: any) => {
            if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
                this.processDeclaration(node, scriptContent, startLineOffset, filePath, localDefs, fileExports);
            } else if (node.type === 'ExpressionStatement') {
                // Top level calls
                this.processExpression(node, scriptContent, startLineOffset, filePath);
            }
        });

        this.exportsRegistry.set(filePath, fileExports);

        // 3. Resolve Dependencies for nodes in this file
        this.nodes.forEach(node => {
            if (node.filePath === filePath && node.type !== 'template') {
                // @ts-ignore
                if (node.astNode) {
                    // @ts-ignore
                    const deps = findDependenciesInAST(node.astNode, localDefs, node.id);
                    // Add deps: convert local name to local ID
                    deps.forEach(dName => {
                        const dId = `${filePath}::${dName}`;
                        if (this.nodes.has(dId) && !node.dependencies.includes(dId)) {
                            node.dependencies.push(dId);
                        }
                    });
                }
            }
        });

        // 4. Handle Vue Templates and Default Export linkage
        if (isVue) {
            const templateId = this.processVueTemplate(filePath, templateContent, templateAst, templateStartLine, templateContentOffset);
            this.ensureDefaultExport(filePath, templateId);
        }

        // 5. Handle React/TSX JSX and Default Export linkage
        if (isTsx) {
            const jsxId = this.processReactJSX(filePath, ast, scriptContent);
            if (jsxId) {
                this.ensureDefaultExport(filePath, jsxId);
            }
        }

        // 6. Create FILE_ROOT for non-Vue/non-TSX files (pure TS files)
        if (!isVue && !isTsx) {
            const fileRootId = this.processFileRoot(filePath, scriptContent, localDefs, ast);
            this.ensureDefaultExport(filePath, fileRootId);
        }

    } catch (e) {
        console.error(`Error parsing file ${filePath}:`, e);
    }
  }

  private processDeclaration(node: any, code: string, lineOffset: number, filePath: string, localDefs: Set<string>, fileExports: Map<string, string>) {
     const getSnippet = (n: any) => code.substring(n.start, n.end);
     const getLine = (n: any) => n.loc.start.line + lineOffset;

     const createNode = (name: string, type: VariableNode['type'], astNode: any, isExported: boolean = false, exportName: string = name) => {
         const id = `${filePath}::${name}`;
         this.nodes.set(id, {
             id,
             label: name,
             filePath,
             type,
             codeSnippet: getSnippet(node), 
             startLine: getLine(node),
             dependencies: [],
             // @ts-ignore
             astNode
         });
         localDefs.add(name);
         if (isExported) {
             fileExports.set(exportName, id);
         }
     };

     // Handle Exports wrapper
     const isExport = node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration';
     const isDefaultExport = node.type === 'ExportDefaultDeclaration';
     const targetNode = isExport ? node.declaration : node;

     if (!targetNode) return;

     const inferType = (initCode: string): VariableNode['type'] => {
         if (initCode.includes('computed')) return 'computed';
         if (initCode.includes('use') && !initCode.includes('useRoute')) return 'hook';
         if (initCode.includes('storeToRefs')) return 'store';
         return 'ref';
     };

     if (targetNode.type === 'VariableDeclaration') {
         targetNode.declarations.forEach((decl: any) => {
             const ids = extractIdentifiersFromPattern(decl.id);
             const initCode = decl.init ? getSnippet(decl.init) : '';
             const type = inferType(initCode);

             // Check if this is a React component (arrow function with hooks)
             const varName = decl.id.type === 'Identifier' ? decl.id.name : '';
             const isReactComponent = varName && varName[0] === varName[0].toUpperCase();
             const isArrowFunction = decl.init && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression');
             const usesHooks = decl.init && isArrowFunction && this.hasHooksInFunction(decl.init);

             // FIX: Always create the node for the variable/component itself!
             ids.forEach(name => createNode(name, type, decl.init, isExport));

             if (isReactComponent && isArrowFunction && usesHooks) {
                 console.log('🔧 Found React component (arrow function) with hooks:', varName);
                 // Process component statements as separate nodes
                 this.processReactComponentStatements(filePath, varName, decl.init, code, lineOffset, localDefs);
             }
         });
     } else if (targetNode.type === 'FunctionDeclaration') {
         const name = targetNode.id ? targetNode.id.name : 'default';

         // Check if this is a React component with hooks
         const isReactComponent = name[0] === name[0].toUpperCase(); // PascalCase
         const usesHooks = this.hasHooksInFunction(targetNode);

         // FIX: Always create the node for the function/component itself!
         createNode(name, 'function', targetNode, isExport, isDefaultExport ? 'default' : name);

         if (isReactComponent && usesHooks) {
             console.log('🔧 Found React component with hooks:', name);
             // Process component statements as separate nodes
             this.processReactComponentStatements(filePath, name, targetNode, code, lineOffset, localDefs);
         }
     } else if (targetNode.type === 'ClassDeclaration') {
         const name = targetNode.id ? targetNode.id.name : 'default';
         // Pass entire class node to preserve constructor/method info
         createNode(name, 'function', targetNode, isExport, isDefaultExport ? 'default' : name);
     }
  }

  private hasHooksInFunction(functionNode: any): boolean {
    const seen = new Set<any>();
    
    // Check if function body contains any calls to functions starting with 'use'
    const checkNode = (node: any): boolean => {
      if (!node || typeof node !== 'object') return false;
      if (seen.has(node)) return false;
      seen.add(node);

      if (node.type === 'CallExpression') {
        if (node.callee.type === 'Identifier' && node.callee.name.startsWith('use')) {
          return true;
        }
      }

      // Recursively check all child nodes
      for (const key in node) {
        if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) continue;
        const value = node[key];

        if (Array.isArray(value)) {
          if (value.some(item => checkNode(item))) return true;
        } else if (typeof value === 'object') {
          if (checkNode(value)) return true;
        }
      }

      return false;
    };

    return checkNode(functionNode.body);
  }

  private processReactComponentStatements(
    filePath: string,
    componentName: string,
    functionNode: any,
    code: string,
    lineOffset: number,
    localDefs: Set<string>
  ) {
    const body = functionNode.body;
    if (!body || body.type !== 'BlockStatement') return;

    const statements = body.body;

    statements.forEach((stmt: any, index: number) => {
      const snippetStart = stmt.start;
      const snippetEnd = stmt.end;
      const snippet = code.substring(snippetStart, snippetEnd);
      const lineNum = stmt.loc.start.line + lineOffset;

      // Generate unique ID for this statement
      const stmtId = `${filePath}::${componentName}_stmt_${index + 1}`;

      // Determine statement type and extract variable names
      let label = '';
      let type: VariableNode['type'] = 'ref';
      const variableNames: string[] = [];

      if (stmt.type === 'VariableDeclaration') {
        const decl = stmt.declarations[0];
        if (decl && decl.id.type === 'Identifier') {
          label = decl.id.name;
          variableNames.push(decl.id.name);
        } else if (decl && decl.id.type === 'ArrayPattern') {
          const names = decl.id.elements.map((el: any) => el?.name).filter(Boolean);
          label = `[${names.join(', ')}]`;
          variableNames.push(...names);
        } else if (decl && decl.id.type === 'ObjectPattern') {
          const names = decl.id.properties.map((prop: any) => prop.key?.name).filter(Boolean);
          label = `{${names.join(', ')}}`;
          variableNames.push(...names);
        }

        // Detect hooks
        if (decl.init?.callee?.name?.startsWith('use')) {
          type = 'hook';
        }
      } else if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'CallExpression') {
        const callExpr = stmt.expression;
        if (callExpr.callee.type === 'Identifier') {
          label = `${callExpr.callee.name}()`;
          if (callExpr.callee.name.startsWith('use')) {
            type = 'hook';
          }
        }
      } else if (stmt.type === 'ReturnStatement') {
        label = 'return JSX';
        type = 'template';
      } else {
        label = `statement ${index + 1}`;
      }

      // Create statement node
      this.nodes.set(stmtId, {
        id: stmtId,
        label,
        filePath,
        type,
        codeSnippet: snippet,
        startLine: lineNum,
        dependencies: [],
        // @ts-ignore
        astNode: stmt
      });

      // Create individual variable nodes that point to the statement
      variableNames.forEach(varName => {
        const varId = `${filePath}::${varName}`;

        // Only create if not already exists (avoid overwriting imports)
        if (!this.nodes.has(varId)) {
          this.nodes.set(varId, {
            id: varId,
            label: varName,
            filePath,
            type,
            codeSnippet: snippet,
            startLine: lineNum,
            dependencies: [],
            // @ts-ignore
            astNode: stmt // Link AST node so dependencies (e.g. useUsers) are found later
          });
          localDefs.add(varName);
        }
      });

      localDefs.add(label);
    });

    console.log(`   Created ${statements.length} statement nodes for ${componentName}`);
  }

  private processExpression(node: any, code: string, lineOffset: number, filePath: string) {
        const expr = node.expression;
        const isCall = expr.type === 'CallExpression';
        const isAwaitCall = expr.type === 'AwaitExpression' && expr.argument.type === 'CallExpression';

        if (isCall || isAwaitCall) {
           const callExpr = isCall ? expr : expr.argument;
           const baseLabel = callExpr.callee.type === 'Identifier' ? `${callExpr.callee.name}()` :
                             callExpr.callee.type === 'MemberExpression' ? `${callExpr.callee.property.name}()` :
                             'Expression';
           const label = isAwaitCall ? `await ${baseLabel}` : baseLabel;

           const id = `${filePath}::setup_call_${node.loc.start.line}`;

           this.nodes.set(id, {
               id,
               label,
               filePath,
               type: 'call',
               codeSnippet: code.substring(node.start, node.end),
               startLine: node.loc.start.line + lineOffset,
               dependencies: [],
               // @ts-ignore
               astNode: expr
           });
        }
  }
}
