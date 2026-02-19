/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Configuration object defining CSS variables for light and dark themes.
 * This ensures both themes have the same variables defined and reduces duplication.
 */
const THEME_CONFIG: Record<string, { light: string; dark: string }> = {
  // Border colors
  '--mito-theme-border-color0': { light: '#bdbdbd', dark: '#3c3c3c' },
  '--mito-theme-border-color1': { light: '#bdbdbd', dark: '#3c3c3c' },
  '--mito-theme-border-color2': { light: '#e0e0e0', dark: '#2d2d2d' },
  '--mito-theme-border-color3': { light: '#eee', dark: '#252526' },
  '--mito-theme-inverse-border-color': { light: '#757575', dark: '#5a5a5a' },

  // UI Font colors
  '--mito-theme-ui-font-color0': { light: 'rgba(0, 0, 0, 1)', dark: 'rgba(255, 255, 255, 1)' },
  '--mito-theme-ui-font-color1': { light: 'rgba(0, 0, 0, 0.87)', dark: 'rgba(255, 255, 255, 0.87)' },
  '--mito-theme-ui-font-color2': { light: 'rgba(0, 0, 0, 0.54)', dark: 'rgba(255, 255, 255, 0.6)' },
  '--mito-theme-ui-font-color3': { light: 'rgba(0, 0, 0, 0.38)', dark: 'rgba(255, 255, 255, 0.4)' },
  '--mito-theme-ui-inverse-font-color0': { light: 'rgba(255, 255, 255, 1)', dark: 'rgba(0, 0, 0, 1)' },
  '--mito-theme-ui-inverse-font-color1': { light: 'rgba(255, 255, 255, 1)', dark: 'rgba(0, 0, 0, 0.87)' },
  '--mito-theme-ui-inverse-font-color2': { light: 'rgba(255, 255, 255, 0.7)', dark: 'rgba(0, 0, 0, 0.6)' },
  '--mito-theme-ui-inverse-font-color3': { light: 'rgba(255, 255, 255, 0.5)', dark: 'rgba(0, 0, 0, 0.4)' },

  // Content Font colors
  '--mito-theme-content-font-color0': { light: 'rgba(0, 0, 0, 1)', dark: 'rgba(255, 255, 255, 1)' },
  '--mito-theme-content-font-color1': { light: 'rgba(0, 0, 0, 0.87)', dark: 'rgba(255, 255, 255, 0.87)' },
  '--mito-theme-content-font-color2': { light: 'rgba(0, 0, 0, 0.54)', dark: 'rgba(255, 255, 255, 0.6)' },
  '--mito-theme-content-font-color3': { light: 'rgba(0, 0, 0, 0.38)', dark: 'rgba(255, 255, 255, 0.4)' },
  '--mito-theme-content-link-color': { light: '#0d47a1', dark: '#7c93ee' },
  '--mito-theme-content-link-visited-color': { light: '#7b1fa2', dark: '#b39ddb' },

  // Layout colors
  '--mito-theme-layout-color0': { light: 'white', dark: '#1a1a1a' },
  '--mito-theme-layout-color1': { light: 'white', dark: '#1e1e1e' },
  '--mito-theme-layout-color2': { light: '#eee', dark: '#252526' },
  '--mito-theme-layout-color3': { light: '#bdbdbd', dark: '#2d2d2d' },
  '--mito-theme-layout-color4': { light: '#757575', dark: '#3c3c3c' },
  '--mito-theme-inverse-layout-color0': { light: '#111', dark: '#ffffff' },
  '--mito-theme-inverse-layout-color1': { light: '#212121', dark: '#f0f0f0' },
  '--mito-theme-inverse-layout-color2': { light: '#424242', dark: '#d4d4d4' },
  '--mito-theme-inverse-layout-color3': { light: '#616161', dark: '#a0a0a0' },
  '--mito-theme-inverse-layout-color4': { light: '#757575', dark: '#6e6e6e' },

  // Brand colors
  '--mito-theme-brand-color0': { light: 'var(--purple-900)', dark: '#C65FAA' },
  '--mito-theme-brand-color1': { light: 'var(--purple-700)', dark: '#D97BC0' },
  '--mito-theme-brand-color2': { light: 'var(--purple-500)', dark: '#E8A3D5' },
  '--mito-theme-brand-color3': { light: 'var(--purple-300)', dark: '#F4D1EA' },
  '--mito-theme-brand-color4': { light: 'var(--purple-300)', dark: '#FAE8F5' },

  // Primary button colors
  '--mito-theme-button-background': { light: 'var(--blue-300)', dark: '#F4D1EA' },
  '--mito-theme-button-border': { light: 'var(--blue-900)', dark: '#C65FAA' },
  '--mito-theme-button-text': { light: 'var(--blue-900)', dark: 'rgba(0, 0, 0, 0.87)' },
  '--mito-theme-button-hover-background': { light: 'var(--blue-400)', dark: '#FAE8F5' },

  // Cell editor colors
  '--mito-theme-cell-editor-background': { light: '#f5f5f5', dark: '#1e1e1e' },
  '--mito-theme-cell-editor-border-color': { light: '#e0e0e0', dark: '#3c3c3c' },
  '--mito-theme-cell-editor-active-background': { light: 'var(--mito-theme-layout-color0)', dark: '#252526' },
  '--mito-theme-cell-prompt-not-active-font-color': { light: '#616161', dark: '#6e6e6e' },
  '--mito-theme-cell-outprompt-font-color': { light: '#bf5b3d', dark: '#f59e0b' },

  // Notebook colors
  '--mito-theme-notebook-select-background': { light: 'var(--mito-theme-layout-color1)', dark: '#2d2d2d' },
  '--mito-theme-notebook-multiselected-color': { light: '#e3f2fd', dark: 'rgba(198, 95, 170, 0.2)' },

  // Rendermime colors
  '--mito-theme-rendermime-error-background': { light: '#fdd', dark: 'rgba(244, 67, 54, 0.2)' },
  '--mito-theme-rendermime-table-row-background': { light: '#ebebeb', dark: '#252526' },
  '--mito-theme-rendermime-table-row-hover-background': { light: '#e1f5fe', dark: '#2d2d2d' },

  // Dialog colors
  '--mito-theme-dialog-background': { light: 'rgba(0, 0, 0, 0.25)', dark: 'rgba(0, 0, 0, 0.5)' },

  // Input field colors
  '--mito-theme-input-background': { light: '#f5f5f5', dark: '#2d2d2d' },
  '--mito-theme-input-border-color': { light: 'var(--mito-theme-inverse-border-color)', dark: '#3c3c3c' },

  // Editor colors
  '--mito-theme-editor-selected-background': { light: '#d9d9d9', dark: '#3c3c3c' },
  '--mito-theme-editor-selected-focused-background': { light: '#d7d4f0', dark: '#3d4a5c' },
  '--mito-theme-editor-cursor-color': { light: 'var(--mito-theme-ui-font-color0)', dark: '#ffffff' },

  // Line number colors
  '--mito-theme-line-number-color': { light: '#92999F', dark: '#92999F' },

  // Code mirror colors
  '--mito-theme-mirror-editor-keyword-color': { light: '#008000', dark: '#c586c0' },
  '--mito-theme-mirror-editor-atom-color': { light: '#88f', dark: '#b5cea8' },
  '--mito-theme-mirror-editor-number-color': { light: '#080', dark: '#b5cea8' },
  '--mito-theme-mirror-editor-def-color': { light: '#00f', dark: '#dcdcaa' },
  '--mito-theme-mirror-editor-variable-color': { light: '#212121', dark: '#9cdcfe' },
  '--mito-theme-mirror-editor-variable-2-color': { light: 'rgb(0, 54, 109)', dark: '#4fc1ff' },
  '--mito-theme-mirror-editor-variable-3-color': { light: '#085', dark: '#4ec9b0' },
  '--mito-theme-mirror-editor-punctuation-color': { light: '#05a', dark: '#d4d4d4' },
  '--mito-theme-mirror-editor-property-color': { light: '#05a', dark: '#9cdcfe' },
  '--mito-theme-mirror-editor-operator-color': { light: '#7800c2', dark: '#d4d4d4' },
  '--mito-theme-mirror-editor-comment-color': { light: '#408080', dark: '#6a9955' },
  '--mito-theme-mirror-editor-string-color': { light: '#ba2121', dark: '#ce9178' },
  '--mito-theme-mirror-editor-string-2-color': { light: '#708', dark: '#ce9178' },
  '--mito-theme-mirror-editor-meta-color': { light: '#a2f', dark: '#d4d4d4' },
  '--mito-theme-mirror-editor-qualifier-color': { light: '#555', dark: '#d4d4d4' },
  '--mito-theme-mirror-editor-builtin-color': { light: '#008000', dark: '#4ec9b0' },
  '--mito-theme-mirror-editor-bracket-color': { light: '#997', dark: '#ffd700' },
  '--mito-theme-mirror-editor-tag-color': { light: '#170', dark: '#569cd6' },
  '--mito-theme-mirror-editor-attribute-color': { light: '#00c', dark: '#9cdcfe' },
  '--mito-theme-mirror-editor-header-color': { light: 'blue', dark: '#569cd6' },
  '--mito-theme-mirror-editor-quote-color': { light: '#090', dark: '#6a9955' },
  '--mito-theme-mirror-editor-link-color': { light: '#00c', dark: '#569cd6' },
  '--mito-theme-mirror-editor-error-color': { light: '#f00', dark: '#f44747' },
  '--mito-theme-mirror-editor-hr-color': { light: '#999', dark: '#6e6e6e' },

  // Vega colors
  '--mito-theme-vega-background': { light: 'white', dark: '#1e1e1e' }
};

/**
 * MitoPalettes class sets CSS variables for light and dark themes.
 * Similar to catppuccin's approach, this allows a single CSS file to work
 * for both themes by setting different variable values before loading CSS.
 */
export class MitoPalettes {
  /**
   * Helper method to set CSS variables based on the theme
   * @param isLight Whether to set variables for light theme (true) or dark theme (false)
   */
  private setThemeColors(isLight: boolean): void {
    const style = document.documentElement.style;
    Object.entries(THEME_CONFIG).forEach(([variable, values]) => {
      style.setProperty(variable, isLight ? values.light : values.dark);
    });
  }

  /**
   * Set CSS variables for the light theme
   */
  setColorsLight(): void {
    this.setThemeColors(true);
  }

  /**
   * Set CSS variables for the dark theme
   */
  setColorsDark(): void {
    this.setThemeColors(false);
  }
}
