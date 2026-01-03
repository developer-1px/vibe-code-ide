/**
 * ThemeAdapter - 사용자 정의 테마 적용 시스템
 *
 * 이 파일은 미래 확장을 위한 스켈레톤입니다.
 * 현재는 CSS 변수 시스템이 테마를 관리하지만,
 * 나중에 JSON 기반 커스텀 테마 지원이 필요할 때
 * 이 Adapter를 통해 동적으로 테마를 적용할 수 있습니다.
 */

/**
 * 사용자 정의 테마 JSON 포맷
 *
 * @example
 * ```json
 * {
 *   "name": "my-theme",
 *   "colors": {
 *     "keyword": "#ff6b9d",
 *     "variable": "#c792ea",
 *     "comment": "#676e95"
 *   }
 * }
 * ```
 */
export interface ThemeJSON {
  name: string;
  colors: {
    // Basic syntax colors (mapped to --code-* CSS variables)
    keyword?: string;
    variable?: string;
    comment?: string;
    string?: string;
    number?: string;

    // Interactive element colors
    self?: string;                    // Definition highlights
    externalImport?: string;          // Import statements
    externalClosure?: string;         // Closure variables
    externalFunction?: string;        // External functions
    parameter?: string;               // Function parameters
    localVariable?: string;           // Local variables

    [key: string]: string | undefined; // Allow additional custom colors
  };
}

/**
 * ThemeAdapter - 테마 JSON을 CSS 변수로 변환
 *
 * @example
 * ```typescript
 * const myTheme: ThemeJSON = {
 *   name: "custom-dark",
 *   colors: {
 *     keyword: "#ff6b9d",
 *     variable: "#c792ea"
 *   }
 * };
 *
 * ThemeAdapter.apply(myTheme);
 * ```
 */
export class ThemeAdapter {
  /**
   * CSS 변수 매핑 테이블
   * ThemeJSON의 키를 실제 CSS 변수명으로 변환
   */
  private static readonly CSS_VAR_MAPPING: Record<string, string> = {
    // Basic syntax
    'keyword': '--code-keyword',
    'variable': '--code-variable',
    'comment': '--code-comment',
    'string': '--code-string',
    'number': '--code-number',

    // Interactive elements
    'self': '--code-self',
    'externalImport': '--code-external-import',
    'externalClosure': '--code-external-closure',
    'externalFunction': '--code-external-function',
    'parameter': '--code-parameter',
    'localVariable': '--code-local-variable',
  };

  /**
   * 테마 JSON을 적용하여 CSS 변수를 동적으로 변경
   *
   * @param themeJson - 적용할 테마 JSON 객체
   */
  static apply(themeJson: ThemeJSON): void {
    const root = document.documentElement;

    // JSON의 각 색상을 CSS 변수로 설정
    Object.entries(themeJson.colors).forEach(([key, value]) => {
      const cssVar = this.CSS_VAR_MAPPING[key];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
        console.log(`[ThemeAdapter] Set ${cssVar} = ${value}`);
      }
    });

    console.log(`[ThemeAdapter] Applied theme: ${themeJson.name}`);
  }

  /**
   * 테마 초기화 - 모든 커스텀 CSS 변수 제거
   */
  static reset(): void {
    const root = document.documentElement;

    Object.values(this.CSS_VAR_MAPPING).forEach(cssVar => {
      root.style.removeProperty(cssVar);
    });

    console.log('[ThemeAdapter] Reset all theme variables');
  }
}

/**
 * VSCodeThemeAdapter - VS Code 테마 JSON을 변환
 *
 * VS Code의 .json 테마 파일을 ThemeJSON 포맷으로 변환합니다.
 *
 * @example
 * ```typescript
 * fetch('vscode-theme.json')
 *   .then(res => res.json())
 *   .then(vscodeTheme => {
 *     const converted = VSCodeThemeAdapter.fromVSCodeJSON(vscodeTheme);
 *     ThemeAdapter.apply(converted);
 *   });
 * ```
 *
 * @note 현재는 스켈레톤입니다. 실제 구현은 VS Code 테마 포맷 분석 후 추가해야 합니다.
 */
export class VSCodeThemeAdapter extends ThemeAdapter {
  /**
   * VS Code 테마 JSON을 ThemeJSON으로 변환
   *
   * @param vscodeTheme - VS Code 테마 객체
   * @returns ThemeJSON 포맷으로 변환된 테마
   */
  static fromVSCodeJSON(vscodeTheme: any): ThemeJSON {
    // TODO: VS Code 테마 포맷 분석 및 변환 로직 구현
    // vscodeTheme.tokenColors 배열에서 scope 기반으로 색상 추출

    return {
      name: vscodeTheme.name || 'vscode-custom',
      colors: {
        // 예시: scope 기반 매핑 (실제 구현 필요)
        keyword: this.findColorByScope(vscodeTheme, 'keyword'),
        variable: this.findColorByScope(vscodeTheme, 'variable'),
        comment: this.findColorByScope(vscodeTheme, 'comment'),
        string: this.findColorByScope(vscodeTheme, 'string'),
      }
    };
  }

  private static findColorByScope(theme: any, scope: string): string | undefined {
    // TODO: tokenColors 배열에서 scope 찾아서 foreground 색상 반환
    return undefined;
  }
}

/**
 * JetBrainsThemeAdapter - JetBrains 테마 XML을 변환
 *
 * IntelliJ IDEA 등의 .icls 테마 파일을 ThemeJSON 포맷으로 변환합니다.
 *
 * @note 현재는 스켈레톤입니다. 실제 구현은 JetBrains 테마 포맷 분석 후 추가해야 합니다.
 */
export class JetBrainsThemeAdapter extends ThemeAdapter {
  /**
   * JetBrains 테마 XML을 ThemeJSON으로 변환
   *
   * @param themeXml - JetBrains 테마 XML 문자열
   * @returns ThemeJSON 포맷으로 변환된 테마
   */
  static fromXML(themeXml: string): ThemeJSON {
    // TODO: XML 파싱 및 색상 추출 로직 구현

    return {
      name: 'jetbrains-custom',
      colors: {}
    };
  }
}
