// --- Path Utilities ---

export const normalizePath = (path: string) => path.replace(/\\/g, '/');

export const resolvePath = (currentFile: string, importPath: string): string | null => {
  // Handle Alias (~~) - Common in Nuxt
  if (importPath.startsWith('~~/')) {
    return normalizePath(importPath.replace('~~/', 'src/'));
  }
  // Handle Alias (~)
  if (importPath.startsWith('~/')) {
    // Assume ~ maps to src/ (which we treat as root for simplicity in this flat map, or specifically to 'src/')
    return normalizePath(importPath.replace('~/', 'src/'));
  }
  if (importPath.startsWith('@/')) {
    return normalizePath(importPath.replace('@/', 'src/'));
  }

  // Handle Relative
  if (importPath.startsWith('.')) {
    const currentDir = currentFile.substring(0, currentFile.lastIndexOf('/'));
    const parts = currentDir.split('/').filter(Boolean);
    const importParts = importPath.split('/');

    for (const part of importParts) {
      if (part === '.') continue;
      if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    }
    
    const resolved = parts.join('/');
    return resolved;
  }

  return importPath; // Absolute or External
};

export const findFileInProject = (files: Record<string, string>, resolvedPath: string): string | null => {
    // Try exact match
    if (files[resolvedPath]) return resolvedPath;
    // Try extensions
    if (files[resolvedPath + '.ts']) return resolvedPath + '.ts';
    if (files[resolvedPath + '.vue']) return resolvedPath + '.vue';
    if (files[resolvedPath + '.js']) return resolvedPath + '.js';
    // Try index
    if (files[resolvedPath + '/index.ts']) return resolvedPath + '/index.ts';
    
    return null;
};
