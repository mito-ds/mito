/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Lavender light palette — cool slate-lavender with layered surfaces.
 * Base shades: #fafafa, #e4e5f1, #d2d3db, #9394a5, #484b6a
 * Applied on top of Mito Light base values via setColorsLavender().
 */
export const LAVENDER_THEME_OVERRIDES: Record<string, string> = {
  // Lavender brand tokens (referenced by lavender.css and components)
  '--mito-lavender-primary': '#484b6a',
  '--mito-lavender-secondary': '#6d7085',
  '--mito-lavender-tertiary': '#d2d3db',
  '--mito-lavender-canvas': '#e4e5f1',
  '--mito-lavender-surface': '#ffffff',
  '--mito-lavender-text-primary': '#32344a',
  '--mito-lavender-text-secondary': '#6d7085',
  '--mito-lavender-text-muted': '#9394a5',
  '--mito-lavender-border': '#c8cad6',

  // Borders
  '--mito-theme-border-color0': '#c8cad6',
  '--mito-theme-border-color1': '#c8cad6',
  '--mito-theme-border-color2': '#d2d3db',
  '--mito-theme-border-color3': '#e4e5f1',
  '--mito-theme-inverse-border-color': '#9394a5',

  // UI font colors
  '--mito-theme-ui-font-color0': '#32344a',
  '--mito-theme-ui-font-color1': '#32344a',
  '--mito-theme-ui-font-color2': '#6d7085',
  '--mito-theme-ui-font-color3': '#9394a5',

  // Content font colors
  '--mito-theme-content-font-color0': '#32344a',
  '--mito-theme-content-font-color1': '#32344a',
  '--mito-theme-content-font-color2': '#6d7085',
  '--mito-theme-content-font-color3': '#9394a5',
  '--mito-theme-content-link-color': '#484b6a',
  '--mito-theme-content-link-visited-color': '#6d7085',

  // Layout — tinted canvas with white elevated surfaces
  '--mito-theme-layout-color0': '#ffffff',
  '--mito-theme-layout-color1': '#e4e5f1',
  '--mito-theme-layout-color2': '#d8dae4',
  '--mito-theme-layout-color3': '#c8cad6',
  '--mito-theme-layout-color4': '#9394a5',
  '--mito-theme-inverse-layout-color0': '#32344a',
  '--mito-theme-inverse-layout-color1': '#484b6a',
  '--mito-theme-inverse-layout-color2': '#6d7085',
  '--mito-theme-inverse-layout-color3': '#9394a5',
  '--mito-theme-inverse-layout-color4': '#d2d3db',

  // Brand
  '--mito-theme-brand-color0': '#484b6a',
  '--mito-theme-brand-color1': '#484b6a',
  '--mito-theme-brand-color2': '#6d7085',
  '--mito-theme-brand-color3': '#d2d3db',
  '--mito-theme-brand-color4': '#e4e5f1',

  // Primary buttons
  '--mito-theme-button-background': '#484b6a',
  '--mito-theme-button-border': '#3a3d54',
  '--mito-theme-button-text': '#ffffff',
  '--mito-theme-button-hover-background': '#3a3d54',

  // Cell editor
  '--mito-theme-cell-editor-background': '#ffffff',
  '--mito-theme-cell-editor-border-color': '#c8cad6',
  '--mito-theme-cell-editor-active-background': '#ffffff',
  '--mito-theme-cell-prompt-not-active-font-color': '#9394a5',
  '--mito-theme-cell-outprompt-font-color': '#6d7085',

  // Notebook
  '--mito-theme-notebook-select-background': '#ffffff',
  '--mito-theme-notebook-multiselected-color': '#d2d3db',

  // Rendermime
  '--mito-theme-rendermime-error-background': '#ece0e2',
  '--mito-theme-rendermime-table-row-background': '#f7f7fa',
  '--mito-theme-rendermime-table-row-hover-background': '#e4e5f1',

  // Inputs
  '--mito-theme-input-background': '#ffffff',
  '--mito-theme-input-border-color': '#c8cad6',

  // Editor selection
  '--mito-theme-editor-selected-background': '#d2d3db',
  '--mito-theme-editor-selected-focused-background': '#c8cad6',
  '--mito-theme-line-number-color': '#9394a5',

  // Code mirror — harmonious accents on lavender base
  '--mito-theme-mirror-editor-keyword-color': '#6b4f8a',
  '--mito-theme-mirror-editor-atom-color': '#3d6a5c',
  '--mito-theme-mirror-editor-number-color': '#8a5a6b',
  '--mito-theme-mirror-editor-def-color': '#484b6a',
  '--mito-theme-mirror-editor-variable-color': '#32344a',
  '--mito-theme-mirror-editor-variable-2-color': '#484b6a',
  '--mito-theme-mirror-editor-variable-3-color': '#3d6a5c',
  '--mito-theme-mirror-editor-punctuation-color': '#6d7085',
  '--mito-theme-mirror-editor-property-color': '#484b6a',
  '--mito-theme-mirror-editor-operator-color': '#6d7085',
  '--mito-theme-mirror-editor-comment-color': '#9394a5',
  '--mito-theme-mirror-editor-string-color': '#3d6a5c',
  '--mito-theme-mirror-editor-string-2-color': '#6b4f8a',
  '--mito-theme-mirror-editor-meta-color': '#6d7085',
  '--mito-theme-mirror-editor-qualifier-color': '#6d7085',
  '--mito-theme-mirror-editor-builtin-color': '#484b6a',
  '--mito-theme-mirror-editor-bracket-color': '#9394a5',
  '--mito-theme-mirror-editor-tag-color': '#484b6a',
  '--mito-theme-mirror-editor-attribute-color': '#3d6a5c',
  '--mito-theme-mirror-editor-header-color': '#484b6a',
  '--mito-theme-mirror-editor-quote-color': '#3d6a5c',
  '--mito-theme-mirror-editor-link-color': '#484b6a',
  '--mito-theme-mirror-editor-error-color': '#8a5a6b',
  '--mito-theme-mirror-editor-hr-color': '#d2d3db',

  // Toolbar
  '--mito-theme-segmented-control-active-text': '#32344a',
  '--mito-theme-segmented-control-inactive-text': '#9394a5',
  '--mito-theme-toolbar-secondary-btn-border': '#c8cad6',
  '--mito-theme-toolbar-secondary-btn-hover-bg': '#d2d3db',
  '--mito-theme-toolbar-control-background': '#e4e5f1',
  '--mito-theme-toolbar-control-active-background': '#ffffff',
  '--mito-theme-toolbar-control-hover-background': '#d8dae4',
  '--mito-theme-toolbar-control-active-hover-background': '#f7f7fa',
  '--mito-theme-toolbar-control-active-shadow':
    '0 1px 2px rgb(72 75 106 / 10%), 0 0 0 1px rgb(72 75 106 / 14%)',
  '--mito-theme-toolbar-menu-background': '#ffffff',
  '--mito-theme-toolbar-menu-border': '#c8cad6',
  '--mito-theme-toolbar-menu-shadow':
    '0 16px 40px rgb(50 52 74 / 10%), 0 2px 6px rgb(50 52 74 / 6%)',
  '--mito-theme-toolbar-primary-text': '#32344a',
  '--mito-theme-toolbar-secondary-text': '#6d7085',
  '--mito-theme-toolbar-muted-text': '#9394a5',
  '--mito-theme-toolbar-accent-text': '#484b6a',
  '--mito-theme-toolbar-accent-hover-text': '#3a3d54',
  '--mito-theme-toolbar-accent-background': '#d2d3db',
  '--mito-theme-toolbar-divider': '#c8cad6',
  '--mito-theme-toolbar-focus-outline': '#9394a5',
  '--mito-theme-toolbar-warning': '#8a5a6b',
  '--mito-theme-toolbar-primary-btn-background': '#484b6a',
  '--mito-theme-toolbar-primary-btn-hover-background': '#3a3d54',
  '--mito-theme-toolbar-primary-btn-border': '#3a3d54',
  '--mito-theme-toolbar-primary-btn-text': '#ffffff',
  '--mito-theme-toolbar-primary-btn-divider': 'rgb(255 255 255 / 18%)',
  '--mito-theme-toolbar-primary-btn-shadow': '0 1px 0 rgb(58 61 84 / 24%)',

  '--mito-theme-vega-background': '#ffffff'
};

export const LAVENDER_THEME_BODY_ATTR = 'data-mito-theme';
export const LAVENDER_THEME_BODY_VALUE = 'lavender';
