/**
 * TreeView - Generic, reusable tree component
 *
 * Features:
 * - Generic type support <TNode>
 * - Render props pattern for full customization
 * - Automatic index tracking for keyboard navigation
 * - Collapse/expand state management
 * - Focus state management
 * - Zero-opinion styling (completely customizable)
 *
 * @example
 * <TreeView
 *   data={fileTree}
 *   getNodeType={(node) => node.type}
 *   getNodePath={(node) => node.path}
 *   collapsedPaths={collapsedFolders}
 *   onToggleCollapse={toggleFolder}
 * >
 *   {({ node, depth, isFocused, isCollapsed, itemRef, handleFocus }) => (
 *     <FileTreeItem
 *       ref={itemRef}
 *       label={node.name}
 *       focused={isFocused}
 *       indent={depth}
 *       onFocus={handleFocus}
 *     />
 *   )}
 * </TreeView>
 */
import React from 'react';
import { useTreeState } from './lib/useTreeState';
import { useTreeRenderer } from './lib/useTreeRenderer';
import type { TreeViewProps } from './model/types';

export function TreeView<TNode>({
  data,
  getNodeType,
  getNodePath,
  getNodeChildren,
  collapsedPaths: externalCollapsed,
  onToggleCollapse: externalToggle,
  focusedIndex: externalFocused,
  onFocusChange: externalFocusChange,
  itemRefs: externalRefs,
  children,
  className,
}: TreeViewProps<TNode>) {
  // State management (supports both internal and external state)
  const {
    collapsedPaths,
    toggleCollapse,
    focusedIndex,
    setFocusedIndex,
    itemRefs,
  } = useTreeState({
    collapsedPaths: externalCollapsed,
    onToggleCollapse: externalToggle,
    focusedIndex: externalFocused,
    onFocusChange: externalFocusChange,
    itemRefs: externalRefs,
  });

  // Rendering logic
  const { renderTree } = useTreeRenderer({
    getNodeType,
    getNodePath,
    getNodeChildren,
    collapsedPaths,
    focusedIndex,
    itemRefs,
    setFocusedIndex,
    toggleCollapse,
    children,
  });

  return <div className={className}>{renderTree(data)}</div>;
}
