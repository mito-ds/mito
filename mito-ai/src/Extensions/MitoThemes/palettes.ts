/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * MitoPalettes class sets CSS variables for light and dark themes.
 * Similar to catppuccin's approach, this allows a single CSS file to work
 * for both themes by setting different variable values before loading CSS.
 */
export class MitoPalettes {
  /**
   * Set CSS variables for the light theme
   */
  setColorsLight(): void {
    // Border colors
    document.documentElement.style.setProperty('--mito-theme-border-color0', '#bdbdbd');
    document.documentElement.style.setProperty('--mito-theme-border-color1', '#bdbdbd');
    document.documentElement.style.setProperty('--mito-theme-border-color2', '#e0e0e0');
    document.documentElement.style.setProperty('--mito-theme-border-color3', '#eee');
    document.documentElement.style.setProperty('--mito-theme-inverse-border-color', '#757575');

    // UI Font colors
    document.documentElement.style.setProperty('--mito-theme-ui-font-color0', 'rgba(0, 0, 0, 1)');
    document.documentElement.style.setProperty('--mito-theme-ui-font-color1', 'rgba(0, 0, 0, 0.87)');
    document.documentElement.style.setProperty('--mito-theme-ui-font-color2', 'rgba(0, 0, 0, 0.54)');
    document.documentElement.style.setProperty('--mito-theme-ui-font-color3', 'rgba(0, 0, 0, 0.38)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color0', 'rgba(255, 255, 255, 1)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color1', 'rgba(255, 255, 255, 1)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color2', 'rgba(255, 255, 255, 0.7)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color3', 'rgba(255, 255, 255, 0.5)');

    // Content Font colors
    document.documentElement.style.setProperty('--mito-theme-content-font-color0', 'rgba(0, 0, 0, 1)');
    document.documentElement.style.setProperty('--mito-theme-content-font-color1', 'rgba(0, 0, 0, 0.87)');
    document.documentElement.style.setProperty('--mito-theme-content-font-color2', 'rgba(0, 0, 0, 0.54)');
    document.documentElement.style.setProperty('--mito-theme-content-font-color3', 'rgba(0, 0, 0, 0.38)');
    document.documentElement.style.setProperty('--mito-theme-content-link-color', '#0d47a1');
    document.documentElement.style.setProperty('--mito-theme-content-link-visited-color', '#7b1fa2');

    // Layout colors
    document.documentElement.style.setProperty('--mito-theme-layout-color0', 'white');
    document.documentElement.style.setProperty('--mito-theme-layout-color1', 'white');
    document.documentElement.style.setProperty('--mito-theme-layout-color2', '#eee');
    document.documentElement.style.setProperty('--mito-theme-layout-color3', '#bdbdbd');
    document.documentElement.style.setProperty('--mito-theme-layout-color4', '#757575');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color0', '#111');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color1', '#212121');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color2', '#424242');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color3', '#616161');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color4', '#757575');

    // Brand colors (using purple variables from light theme)
    document.documentElement.style.setProperty('--mito-theme-brand-color0', 'var(--purple-900)');
    document.documentElement.style.setProperty('--mito-theme-brand-color1', 'var(--purple-700)');
    document.documentElement.style.setProperty('--mito-theme-brand-color2', 'var(--purple-500)');
    document.documentElement.style.setProperty('--mito-theme-brand-color3', 'var(--purple-300)');
    document.documentElement.style.setProperty('--mito-theme-brand-color4', 'var(--purple-300)');

    // Primary button colors (light mode: blue theme to avoid pinkish-purple)
    document.documentElement.style.setProperty('--mito-theme-button-background', 'var(--blue-300)');
    document.documentElement.style.setProperty('--mito-theme-button-border', 'var(--blue-900)');
    document.documentElement.style.setProperty('--mito-theme-button-text', 'var(--blue-900)');
    document.documentElement.style.setProperty('--mito-theme-button-hover-background', 'var(--blue-400)');

    // Cell editor colors
    document.documentElement.style.setProperty('--mito-theme-cell-editor-background', '#f5f5f5');
    document.documentElement.style.setProperty('--mito-theme-cell-editor-border-color', '#e0e0e0');
    document.documentElement.style.setProperty('--mito-theme-cell-editor-active-background', 'var(--mito-theme-layout-color0)');
    document.documentElement.style.setProperty('--mito-theme-cell-prompt-not-active-font-color', '#616161');
    document.documentElement.style.setProperty('--mito-theme-cell-outprompt-font-color', '#bf5b3d');

    // Notebook colors
    document.documentElement.style.setProperty('--mito-theme-notebook-select-background', 'var(--mito-theme-layout-color1)');
    document.documentElement.style.setProperty('--mito-theme-notebook-multiselected-color', '#e3f2fd');

    // Rendermime colors
    document.documentElement.style.setProperty('--mito-theme-rendermime-error-background', '#fdd');
    document.documentElement.style.setProperty('--mito-theme-rendermime-table-row-background', '#ebebeb');
    document.documentElement.style.setProperty('--mito-theme-rendermime-table-row-hover-background', '#e1f5fe');

    // Dialog colors
    document.documentElement.style.setProperty('--mito-theme-dialog-background', 'rgba(0, 0, 0, 0.25)');

    // Input field colors
    document.documentElement.style.setProperty('--mito-theme-input-background', '#f5f5f5');
    document.documentElement.style.setProperty('--mito-theme-input-border-color', 'var(--mito-theme-inverse-border-color)');

    // Editor colors
    document.documentElement.style.setProperty('--mito-theme-editor-selected-background', '#d9d9d9');
    document.documentElement.style.setProperty('--mito-theme-editor-selected-focused-background', '#d7d4f0');
    document.documentElement.style.setProperty('--mito-theme-editor-cursor-color', 'var(--mito-theme-ui-font-color0)');

    // Line number colors (grey/white/blue instead of pink)
    document.documentElement.style.setProperty('--mito-theme-line-number-color', '#92999F');

    // Code mirror colors
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-keyword-color', '#008000');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-atom-color', '#88f');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-number-color', '#080');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-def-color', '#00f');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-variable-color', '#212121');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-variable-2-color', 'rgb(0, 54, 109)');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-variable-3-color', '#085');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-punctuation-color', '#05a');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-property-color', '#05a');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-operator-color', '#7800c2');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-comment-color', '#408080');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-string-color', '#ba2121');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-string-2-color', '#708');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-meta-color', '#a2f');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-qualifier-color', '#555');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-builtin-color', '#008000');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-bracket-color', '#997');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-tag-color', '#170');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-attribute-color', '#00c');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-header-color', 'blue');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-quote-color', '#090');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-link-color', '#00c');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-error-color', '#f00');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-hr-color', '#999');

    // Vega colors
    document.documentElement.style.setProperty('--mito-theme-vega-background', 'white');
  }

  /**
   * Set CSS variables for the dark theme
   */
  setColorsDark(): void {
    // Border colors
    document.documentElement.style.setProperty('--mito-theme-border-color0', '#3c3c3c');
    document.documentElement.style.setProperty('--mito-theme-border-color1', '#3c3c3c');
    document.documentElement.style.setProperty('--mito-theme-border-color2', '#2d2d2d');
    document.documentElement.style.setProperty('--mito-theme-border-color3', '#252526');
    document.documentElement.style.setProperty('--mito-theme-inverse-border-color', '#5a5a5a');

    // UI Font colors
    document.documentElement.style.setProperty('--mito-theme-ui-font-color0', 'rgba(255, 255, 255, 1)');
    document.documentElement.style.setProperty('--mito-theme-ui-font-color1', 'rgba(255, 255, 255, 0.87)');
    document.documentElement.style.setProperty('--mito-theme-ui-font-color2', 'rgba(255, 255, 255, 0.6)');
    document.documentElement.style.setProperty('--mito-theme-ui-font-color3', 'rgba(255, 255, 255, 0.4)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color0', 'rgba(0, 0, 0, 1)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color1', 'rgba(0, 0, 0, 0.87)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color2', 'rgba(0, 0, 0, 0.6)');
    document.documentElement.style.setProperty('--mito-theme-ui-inverse-font-color3', 'rgba(0, 0, 0, 0.4)');

    // Content Font colors
    document.documentElement.style.setProperty('--mito-theme-content-font-color0', 'rgba(255, 255, 255, 1)');
    document.documentElement.style.setProperty('--mito-theme-content-font-color1', 'rgba(255, 255, 255, 0.87)');
    document.documentElement.style.setProperty('--mito-theme-content-font-color2', 'rgba(255, 255, 255, 0.6)');
    document.documentElement.style.setProperty('--mito-theme-content-font-color3', 'rgba(255, 255, 255, 0.4)');
    document.documentElement.style.setProperty('--mito-theme-content-link-color', '#7c93ee');
    document.documentElement.style.setProperty('--mito-theme-content-link-visited-color', '#b39ddb');

    // Layout colors
    document.documentElement.style.setProperty('--mito-theme-layout-color0', '#1a1a1a');
    document.documentElement.style.setProperty('--mito-theme-layout-color1', '#1e1e1e');
    document.documentElement.style.setProperty('--mito-theme-layout-color2', '#252526');
    document.documentElement.style.setProperty('--mito-theme-layout-color3', '#2d2d2d');
    document.documentElement.style.setProperty('--mito-theme-layout-color4', '#3c3c3c');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color0', '#ffffff');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color1', '#f0f0f0');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color2', '#d4d4d4');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color3', '#a0a0a0');
    document.documentElement.style.setProperty('--mito-theme-inverse-layout-color4', '#6e6e6e');

    // Brand colors (pink-purple theme for dark, starting with #C65FAA)
    document.documentElement.style.setProperty('--mito-theme-brand-color0', '#C65FAA');
    document.documentElement.style.setProperty('--mito-theme-brand-color1', '#D97BC0');
    document.documentElement.style.setProperty('--mito-theme-brand-color2', '#E8A3D5');
    document.documentElement.style.setProperty('--mito-theme-brand-color3', '#F4D1EA');
    document.documentElement.style.setProperty('--mito-theme-brand-color4', '#FAE8F5');

    // Primary button colors (dark mode: lighter brand background, dark brand border)
    document.documentElement.style.setProperty('--mito-theme-button-background', '#F4D1EA');
    document.documentElement.style.setProperty('--mito-theme-button-border', '#C65FAA');
    document.documentElement.style.setProperty('--mito-theme-button-text', 'rgba(0, 0, 0, 0.87)');
    document.documentElement.style.setProperty('--mito-theme-button-hover-background', '#FAE8F5');

    // Cell editor colors
    document.documentElement.style.setProperty('--mito-theme-cell-editor-background', '#1e1e1e');
    document.documentElement.style.setProperty('--mito-theme-cell-editor-border-color', '#3c3c3c');
    document.documentElement.style.setProperty('--mito-theme-cell-editor-active-background', '#252526');
    document.documentElement.style.setProperty('--mito-theme-cell-prompt-not-active-font-color', '#6e6e6e');
    document.documentElement.style.setProperty('--mito-theme-cell-outprompt-font-color', '#f59e0b');

    // Notebook colors
    document.documentElement.style.setProperty('--mito-theme-notebook-select-background', '#2d2d2d');
    document.documentElement.style.setProperty('--mito-theme-notebook-multiselected-color', 'rgba(198, 95, 170, 0.2)');

    // Rendermime colors
    document.documentElement.style.setProperty('--mito-theme-rendermime-error-background', 'rgba(244, 67, 54, 0.2)');
    document.documentElement.style.setProperty('--mito-theme-rendermime-table-row-background', '#252526');
    document.documentElement.style.setProperty('--mito-theme-rendermime-table-row-hover-background', '#2d2d2d');

    // Dialog colors
    document.documentElement.style.setProperty('--mito-theme-dialog-background', 'rgba(0, 0, 0, 0.5)');

    // Input field colors
    document.documentElement.style.setProperty('--mito-theme-input-background', '#2d2d2d');
    document.documentElement.style.setProperty('--mito-theme-input-border-color', '#3c3c3c');

    // Editor colors
    document.documentElement.style.setProperty('--mito-theme-editor-selected-background', '#3c3c3c');
    document.documentElement.style.setProperty('--mito-theme-editor-selected-focused-background', '#3d4a5c');
    document.documentElement.style.setProperty('--mito-theme-editor-cursor-color', '#ffffff');
    
    // Line number colors (grey/white/blue instead of pink)
    document.documentElement.style.setProperty('--mito-theme-line-number-color', '#92999F');

    // Code mirror colors
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-keyword-color', '#c586c0');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-atom-color', '#b5cea8');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-number-color', '#b5cea8');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-def-color', '#dcdcaa');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-variable-color', '#9cdcfe');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-variable-2-color', '#4fc1ff');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-variable-3-color', '#4ec9b0');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-punctuation-color', '#d4d4d4');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-property-color', '#9cdcfe');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-operator-color', '#d4d4d4');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-comment-color', '#6a9955');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-string-color', '#ce9178');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-string-2-color', '#ce9178');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-meta-color', '#d4d4d4');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-qualifier-color', '#d4d4d4');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-builtin-color', '#4ec9b0');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-bracket-color', '#ffd700');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-tag-color', '#569cd6');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-attribute-color', '#9cdcfe');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-header-color', '#569cd6');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-quote-color', '#6a9955');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-link-color', '#569cd6');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-error-color', '#f44747');
    document.documentElement.style.setProperty('--mito-theme-mirror-editor-hr-color', '#6e6e6e');

    // Vega colors
    document.documentElement.style.setProperty('--mito-theme-vega-background', '#1e1e1e');
  }
}
