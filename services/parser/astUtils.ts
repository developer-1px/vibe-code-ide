// --- AST Utilities ---

export const extractIdentifiersFromPattern = (pattern: any): string[] => {
    const ids: string[] = [];
    if (pattern.type === 'Identifier') ids.push(pattern.name);
    else if (pattern.type === 'ObjectPattern') {
        pattern.properties.forEach((prop: any) => {
            if (prop.type === 'ObjectProperty' && prop.value.type === 'Identifier') {
                ids.push(prop.value.name);
            }
        });
    } else if (pattern.type === 'ArrayPattern') {
        pattern.elements.forEach((el: any) => {
            if (el && el.type === 'Identifier') ids.push(el.name);
        });
    }
    return ids;
};

export const findDependenciesInAST = (rootNode: any, knownIds: Set<string>, selfId: string): string[] => {
    const deps = new Set<string>();
    if (!rootNode) return [];

    const visit = (node: any) => {
        if (!node || typeof node !== 'object') return;

        if (node.type === 'Identifier') {
            const name = node.name;
            const fullId = `${selfId.split('::')[0]}::${name}`;
            if (knownIds.has(name) && fullId !== selfId) {
                deps.add(name);
            }
            return;
        }
        
        // Skip keys in objects/members to avoid false positives
        if (node.type === 'ObjectProperty' && !node.computed) {
            visit(node.value);
            return;
        }
        if (node.type === 'MemberExpression' && !node.computed) {
            visit(node.object);
            return;
        }

        Object.keys(node).forEach(key => {
            if (['loc', 'start', 'end', 'comments', 'extra', 'type'].includes(key)) return;
            const child = node[key];
            if (Array.isArray(child)) child.forEach(visit);
            else if (child && typeof child === 'object') visit(child);
        });
    };
    visit(rootNode);
    return Array.from(deps);
};

export const traverseTemplateAST = (node: any, knownVars: Set<string>, foundDeps: Set<string>) => {
      if (!node) return;
      
      const checkContent = (text: string) => {
          // Naive regex for performance in demo
          const ids = text.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
          if (ids) {
              ids.forEach(id => {
                  if (knownVars.has(id)) foundDeps.add(id);
              });
          }
      };

      // Type 5 = Interpolation {{ }}
      if (node.type === 5 && node.content?.content) checkContent(node.content.content); 
      
      // Type 1 = Element (Tag)
      if (node.type === 1) {
          const tagName = node.tag;
          // Check for pascal case match (e.g. MarketplaceSelectorType)
          if (knownVars.has(tagName)) {
              foundDeps.add(tagName);
          }
          // Check for kebab case match (e.g. marketplace-selector-type -> MarketplaceSelectorType)
          const pascal = tagName.replace(/-(\w)/g, (_: any, c: string) => c ? c.toUpperCase() : '').replace(/^[a-z]/, (c: string) => c.toUpperCase());
          if (knownVars.has(pascal)) {
               foundDeps.add(pascal);
          }
      }

      if (node.props) {
          node.props.forEach((prop: any) => {
              // Type 7 = Directive (v-if, v-bind, etc.)
              if (prop.type === 7 && prop.exp?.content) checkContent(prop.exp.content); 
          });
      }
      
      if (node.children) {
          node.children.forEach((c: any) => traverseTemplateAST(c, knownVars, foundDeps));
      }
};
