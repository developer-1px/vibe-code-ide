/**
 * Unified Theme System Types
 * Combines App-wide theme and Code Editor theme
 */

/**
 * App Theme - Global UI styling
 */
export interface AppTheme {
  name: string;

  colors: {
    // Main backgrounds
    background: string;      // Main app background
    canvas: string;          // Canvas/workspace area
    sidebar: string;         // Sidebar background
    header: string;          // Header background

    // Text colors
    text: {
      primary: string;       // Main text
      secondary: string;     // Secondary/muted text
      accent: string;        // Accent/highlight text
    };

    // Interactive elements
    border: string;          // Default border color
    hover: string;           // Hover state
    active: string;          // Active/selected state

    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  effects: {
    blur: string;            // Backdrop blur
    shadow: string;          // Box shadow
  };
}

/**
 * Editor Theme - Code syntax highlighting
 */
export interface EditorTheme {
  name: string;

  typography: {
    fontSize: string;
    fontFamily: string;
    lineHeight: string;
  };

  colors: {
    background: string;

    lineNumber: {
      text: string;
      background: string;
      border: string;
    };

    code: {
      normal: string;
      comment: {
        normal: string;
        focus: string;
      };
    };

    template: {
      text: string;
      clickable: {
        bg: string;
        border: string;
        text: string;
        hoverBg: string;
        hoverBorder: string;
      };
    };

    tokens: {
      // Syntax highlighting
      text: string;
      keyword: string;
      punctuation: string;
      string: string;
      comment: string;
      commentFocus: string;

      // Special identifiers
      self: string;
      identifier: string;
      identifierWithDef: string;

      // External dependencies
      externalImport: string;
      externalClosure: string;
      externalFunction: string;

      // Local scope
      parameter: string;
      localVariable: string;

      // Focus mode
      focusGrayscale: string;
    };
  };

  spacing: {
    containerY: string;
    lineX: string;
    lineY: string;
    lineNumberX: string;
  };

  dimensions: {
    lineNumberWidth: string;
    slotSize: string;
    slotSpacing: number;
  };
}

/**
 * Unified Theme - Complete theme configuration
 */
export interface UnifiedTheme {
  name: string;
  app: AppTheme;
  editor: EditorTheme;
}
