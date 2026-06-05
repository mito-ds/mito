/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Opto brand palette — institutional green on warm off-white canvas.
 * Applied on top of Mito Light base values via setColorsOpto().
 */
export const OPTO_THEME_OVERRIDES: Record<string, string> = {
  // Opto brand tokens (referenced by opto.css and components)
  '--mito-opto-green-primary': '#0F4A3F',
  '--mito-opto-green-secondary': '#7FB8A8',
  '--mito-opto-green-tertiary': '#D4E8E0',
  '--mito-opto-canvas': '#FAFAF7',
  '--mito-opto-text-primary': '#1A1A1A',
  '--mito-opto-text-secondary': '#6B6B6B',
  '--mito-opto-border': '#E8E8E5',

  // Borders
  '--mito-theme-border-color0': '#E8E8E5',
  '--mito-theme-border-color1': '#E8E8E5',
  '--mito-theme-border-color2': '#E8E8E5',
  '--mito-theme-border-color3': '#F2F2EF',
  '--mito-theme-inverse-border-color': '#C8C8C5',

  // UI font colors
  '--mito-theme-ui-font-color0': '#1A1A1A',
  '--mito-theme-ui-font-color1': '#1A1A1A',
  '--mito-theme-ui-font-color2': '#6B6B6B',
  '--mito-theme-ui-font-color3': '#9A9A9A',

  // Content font colors
  '--mito-theme-content-font-color0': '#1A1A1A',
  '--mito-theme-content-font-color1': '#1A1A1A',
  '--mito-theme-content-font-color2': '#6B6B6B',
  '--mito-theme-content-font-color3': '#9A9A9A',
  '--mito-theme-content-link-color': '#0F4A3F',
  '--mito-theme-content-link-visited-color': '#6B6B6B',

  // Layout — warm canvas with white elevated surfaces
  '--mito-theme-layout-color0': '#FFFFFF',
  '--mito-theme-layout-color1': '#FAFAF7',
  '--mito-theme-layout-color2': '#F2F2EF',
  '--mito-theme-layout-color3': '#E8E8E5',
  '--mito-theme-layout-color4': '#6B6B6B',
  '--mito-theme-inverse-layout-color0': '#1A1A1A',
  '--mito-theme-inverse-layout-color1': '#2A2A2A',
  '--mito-theme-inverse-layout-color2': '#424242',
  '--mito-theme-inverse-layout-color3': '#6B6B6B',
  '--mito-theme-inverse-layout-color4': '#9A9A9A',

  // Brand greens
  '--mito-theme-brand-color0': '#0F4A3F',
  '--mito-theme-brand-color1': '#0F4A3F',
  '--mito-theme-brand-color2': '#7FB8A8',
  '--mito-theme-brand-color3': '#D4E8E0',
  '--mito-theme-brand-color4': '#E8F4F0',

  // Primary buttons
  '--mito-theme-button-background': '#0F4A3F',
  '--mito-theme-button-border': '#0F4A3F',
  '--mito-theme-button-text': '#FFFFFF',
  '--mito-theme-button-hover-background': '#156B5A',

  // Cell editor
  '--mito-theme-cell-editor-background': '#FFFFFF',
  '--mito-theme-cell-editor-border-color': '#E8E8E5',
  '--mito-theme-cell-editor-active-background': '#FFFFFF',
  '--mito-theme-cell-prompt-not-active-font-color': '#6B6B6B',
  '--mito-theme-cell-outprompt-font-color': '#6B6B6B',

  // Notebook
  '--mito-theme-notebook-select-background': '#FFFFFF',
  '--mito-theme-notebook-multiselected-color': '#D4E8E0',

  // Rendermime — calm neutrals instead of red highlights
  '--mito-theme-rendermime-error-background': '#F2F2EF',
  '--mito-theme-rendermime-table-row-background': '#FAFAF7',
  '--mito-theme-rendermime-table-row-hover-background': '#D4E8E0',

  // Inputs
  '--mito-theme-input-background': '#FFFFFF',
  '--mito-theme-input-border-color': '#E8E8E5',

  // Editor selection
  '--mito-theme-editor-selected-background': '#F2F2EF',
  '--mito-theme-editor-selected-focused-background': '#D4E8E0',
  '--mito-theme-line-number-color': '#9A9A9A',

  // Code mirror — restrained greens, no aggressive reds
  '--mito-theme-mirror-editor-keyword-color': '#0F4A3F',
  '--mito-theme-mirror-editor-atom-color': '#7FB8A8',
  '--mito-theme-mirror-editor-number-color': '#2D6A5A',
  '--mito-theme-mirror-editor-def-color': '#0F4A3F',
  '--mito-theme-mirror-editor-variable-color': '#1A1A1A',
  '--mito-theme-mirror-editor-variable-2-color': '#2D6A5A',
  '--mito-theme-mirror-editor-variable-3-color': '#7FB8A8',
  '--mito-theme-mirror-editor-punctuation-color': '#6B6B6B',
  '--mito-theme-mirror-editor-property-color': '#2D6A5A',
  '--mito-theme-mirror-editor-operator-color': '#6B6B6B',
  '--mito-theme-mirror-editor-comment-color': '#9A9A9A',
  '--mito-theme-mirror-editor-string-color': '#2D6A5A',
  '--mito-theme-mirror-editor-string-2-color': '#7FB8A8',
  '--mito-theme-mirror-editor-meta-color': '#6B6B6B',
  '--mito-theme-mirror-editor-qualifier-color': '#6B6B6B',
  '--mito-theme-mirror-editor-builtin-color': '#0F4A3F',
  '--mito-theme-mirror-editor-bracket-color': '#6B6B6B',
  '--mito-theme-mirror-editor-tag-color': '#0F4A3F',
  '--mito-theme-mirror-editor-attribute-color': '#2D6A5A',
  '--mito-theme-mirror-editor-header-color': '#0F4A3F',
  '--mito-theme-mirror-editor-quote-color': '#7FB8A8',
  '--mito-theme-mirror-editor-link-color': '#0F4A3F',
  '--mito-theme-mirror-editor-error-color': '#6B6B6B',
  '--mito-theme-mirror-editor-hr-color': '#E8E8E5',

  // Toolbar
  '--mito-theme-segmented-control-active-text': '#1A1A1A',
  '--mito-theme-segmented-control-inactive-text': '#6B6B6B',
  '--mito-theme-toolbar-secondary-btn-border': '#E8E8E5',
  '--mito-theme-toolbar-secondary-btn-hover-bg': '#D4E8E0',
  '--mito-theme-toolbar-control-background': '#FAFAF7',
  '--mito-theme-toolbar-control-active-background': '#FFFFFF',
  '--mito-theme-toolbar-control-hover-background': '#F2F2EF',
  '--mito-theme-toolbar-control-active-hover-background': '#FAFAF7',
  '--mito-theme-toolbar-control-active-shadow':
    '0 1px 2px rgb(15 74 63 / 8%), 0 0 0 1px rgb(15 74 63 / 12%)',
  '--mito-theme-toolbar-menu-background': '#FFFFFF',
  '--mito-theme-toolbar-menu-border': '#E8E8E5',
  '--mito-theme-toolbar-menu-shadow':
    '0 16px 40px rgb(26 26 26 / 8%), 0 2px 6px rgb(26 26 26 / 4%)',
  '--mito-theme-toolbar-primary-text': '#1A1A1A',
  '--mito-theme-toolbar-secondary-text': '#6B6B6B',
  '--mito-theme-toolbar-muted-text': '#9A9A9A',
  '--mito-theme-toolbar-accent-text': '#0F4A3F',
  '--mito-theme-toolbar-accent-hover-text': '#156B5A',
  '--mito-theme-toolbar-accent-background': '#D4E8E0',
  '--mito-theme-toolbar-divider': '#E8E8E5',
  '--mito-theme-toolbar-focus-outline': '#7FB8A8',
  '--mito-theme-toolbar-warning': '#6B6B6B',
  '--mito-theme-toolbar-primary-btn-background': '#0F4A3F',
  '--mito-theme-toolbar-primary-btn-hover-background': '#156B5A',
  '--mito-theme-toolbar-primary-btn-border': '#0F4A3F',
  '--mito-theme-toolbar-primary-btn-text': '#FFFFFF',
  '--mito-theme-toolbar-primary-btn-divider': 'rgb(255 255 255 / 18%)',
  '--mito-theme-toolbar-primary-btn-shadow': '0 1px 0 rgb(15 74 63 / 20%)',

  '--mito-theme-vega-background': '#FFFFFF'
};

export const OPTO_THEME_BODY_ATTR = 'data-mito-theme';
export const OPTO_THEME_BODY_VALUE = 'opto';
