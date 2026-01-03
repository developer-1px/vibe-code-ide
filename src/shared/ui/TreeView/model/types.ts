/**
 * TreeView - Type Definitions
 */

/**
 * Context provided to render function for each tree node
 */
export interface TreeNodeContext<TNode> {
  /** The tree node data */
  node: TNode;

  /** Depth level in the tree (0 = root) */
  depth: number;

  /** Whether this node is collapsed (folders only) */
  isCollapsed: boolean;

  /** Whether this node is currently focused (keyboard navigation) */
  isFocused: boolean;

  /** Index in the flat item list (for keyboard navigation) */
  itemIndex: number;

  /** Ref callback for DOM element (required for keyboard navigation) */
  itemRef: (el: HTMLElement | null) => void;

  /** Focus handler (single click) */
  handleFocus: () => void;

  /** Toggle collapse handler (double click for folders) */
  handleToggle: () => void;
}

/**
 * Props for TreeView component
 */
export interface TreeViewProps<TNode> {
  /** Tree data (array of root nodes) */
  data: TNode[];

  /** Extract node type ('folder' | 'file' | custom) */
  getNodeType: (node: TNode) => string;

  /** Extract unique node path */
  getNodePath: (node: TNode) => string;

  /** Extract children nodes (default: node.children) */
  getNodeChildren?: (node: TNode) => TNode[] | undefined;

  /** Collapsed paths state (optional: external state) */
  collapsedPaths?: Set<string>;

  /** Collapse toggle handler (optional: external handler) */
  onToggleCollapse?: (path: string) => void;

  /** Focused index (optional: external state) */
  focusedIndex?: number;

  /** Focus change handler (optional: external handler) */
  onFocusChange?: (index: number) => void;

  /** Item refs for keyboard navigation (optional: external refs) */
  itemRefs?: React.MutableRefObject<Map<number, HTMLElement>>;

  /** Render function (receives context for each node) */
  children: (context: TreeNodeContext<TNode>) => React.ReactNode;

  /** Class name for the root container */
  className?: string;
}
