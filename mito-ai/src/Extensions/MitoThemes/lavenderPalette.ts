/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Lavender light palette — cool desaturated lavender-grays.
 * Shades: #fafafa, #e4e5f1, #d2d3db, #9394a5, #484b6a
 * Applied on top of Mito Light base values via setColorsLavender().
 */
export const LAVENDER_THEME_OVERRIDES: Record<string, string> = {
  // Lavender brand tokens (referenced by lavender.css and components)
  '--mito-lavender-primary': '#484b6a',
  '--mito-lavender-secondary': '#9394a5',
  '--mito-lavender-tertiary': '#e4e5f1',
  '--mito-lavender-canvas': '#fafafa',
  '--mito-lavender-text-primary': '#484b6a',
  '--mito-lavender-text-secondary': '#9394a5',
  '--mito-lavender-border': '#d2d3db',

  // Borders
  '--mito-theme-border-color0': '#d2d3db',
  '--mito-theme-border-color1': '#d2d3db',
  '--mito-theme-border-color2': '#e4e5f1',
  '--mito-theme-border-color3': '#fafafa',
  '--mito-theme-inverse-border-color': '#9394a5',

  // UI font colors
  '--mito-theme-ui-font-color0': '#484b6a',
  '--mito-theme-ui-font-color1': '#484b6a',
  '--mito-theme-ui-font-color2': '#9394a5',
  '--mito-theme-ui-font-color3': '#9394a5',

  // Content font colors
  '--mito-theme-content-font-color0': '#484b6a',
  '--mito-theme-content-font-color1': '#484b6a',
  '--mito-theme-content-font-color2': '#9394a5',
  '--mito-theme-content-font-color3': '#9394a5',
  '--mito-theme-content-link-color': '#484b6a',
  '--mito-theme-content-link-visited-color': '#9394a5',

  // Layout — soft canvas with white elevated surfaces
  '--mito-theme-layout-color0': '#ffffff',
  '--mito-theme-layout-color1': '#fafafa',
  '--mito-theme-layout-color2': '#e4e5f1',
  '--mito-theme-layout-color3': '#d2d3db',
  '--mito-theme-layout-color4': '#9394a5',
  '--mito-theme-inverse-layout-color0': '#484b6a',
  '--mito-theme-inverse-layout-color1': '#484b6a',
  '--mito-theme-inverse-layout-color2': '#9394a5',
  '--mito-theme-inverse-layout-color3': '#d2d3db',
  '--mito-theme-inverse-layout-color4': '#e4e5f1',

  // Brand
  '--mito-theme-brand-color0': '#484b6a',
  '--mito-theme-brand-color1': '#484b6a',
  '--mito-theme-brand-color2': '#9394a5',
  '--mito-theme-brand-color3': '#e4e5f1',
  '--mito-theme-brand-color4': '#fafafa',

  // Primary buttons
  '--mito-theme-button-background': '#484b6a',
  '--mito-theme-button-border': '#484b6a',
  '--mito-theme-button-text': '#ffffff',
  '--mito-theme-button-hover-background': '#5a5d7a',

  // Cell editor
  '--mito-theme-cell-editor-background': '#ffffff',
  '--mito-theme-cell-editor-border-color': '#d2d3db',
  '--mito-theme-cell-editor-active-background': '#ffffff',
  '--mito-theme-cell-prompt-not-active-font-color': '#9394a5',
  '--mito-theme-cell-outprompt-font-color': '#9394a5',

  // Notebook
  '--mito-theme-notebook-select-background': '#ffffff',
  '--mito-theme-notebook-multiselected-color': '#e4e5f1',

  // Rendermime
  '--mito-theme-rendermime-error-background': '#e4e5f1',
  '--mito-theme-rendermime-table-row-background': '#fafafa',
  '--mito-theme-rendermime-table-row-hover-background': '#e4e5f1',

  // Inputs
  '--mito-theme-input-background': '#ffffff',
  '--mito-theme-input-border-color': '#d2d3db',

  // Editor selection
  '--mito-theme-editor-selected-background': '#e4e5f1',
  '--mito-theme-editor-selected-focused-background': '#d2d3db',
  '--mito-theme-line-number-color': '#9394a5',

  // Code mirror — restrained lavender tones
  '--mito-theme-mirror-editor-keyword-color': '#484b6a',
  '--mito-theme-mirror-editor-atom-color': '#9394a5',
  '--mito-theme-mirror-editor-number-color': '#484b6a',
  '--mito-theme-mirror-editor-def-color': '#484b6a',
  '--mito-theme-mirror-editor-variable-color': '#484b6a',
  '--mito-theme-mirror-editor-variable-2-color': '#484b6a',
  '--mito-theme-mirror-editor-variable-3-color': '#9394a5',
  '--mito-theme-mirror-editor-punctuation-color': '#9394a5',
  '--mito-theme-mirror-editor-property-color': '#484b6a',
  '--mito-theme-mirror-editor-operator-color': '#9394a5',
  '--mito-theme-mirror-editor-comment-color': '#9394a5',
  '--mito-theme-mirror-editor-string-color': '#484b6a',
  '--mito-theme-mirror-editor-string-2-color': '#9394a5',
  '--mito-theme-mirror-editor-meta-color': '#9394a5',
  '--mito-theme-mirror-editor-qualifier-color': '#9394a5',
  '--mito-theme-mirror-editor-builtin-color': '#484b6a',
  '--mito-theme-mirror-editor-bracket-color': '#9394a5',
  '--mito-theme-mirror-editor-tag-color': '#484b6a',
  '--mito-theme-mirror-editor-attribute-color': '#484b6a',
  '--mito-theme-mirror-editor-header-color': '#484b6a',
  '--mito-theme-mirror-editor-quote-color': '#9394a5',
  '--mito-theme-mirror-editor-link-color': '#484b6a',
  '--mito-theme-mirror-editor-error-color': '#9394a5',
  '--mito-theme-mirror-editor-hr-color': '#d2d3db',

  // Toolbar
  '--mito-theme-segmented-control-active-text': '#484b6a',
  '--mito-theme-segmented-control-inactive-text': '#9394a5',
  '--mito-theme-toolbar-secondary-btn-border': '#d2d3db',
  '--mito-theme-toolbar-secondary-btn-hover-bg': '#e4e5f1',
  '--mito-theme-toolbar-control-background': '#fafafa',
  '--mito-theme-toolbar-control-active-background': '#ffffff',
  '--mito-theme-toolbar-control-hover-background': '#e4e5f1',
  '--mito-theme-toolbar-control-active-hover-background': '#fafafa',
  '--mito-theme-toolbar-control-active-shadow':
    '0 1px 2px rgb(72 75 106 / 8%), 0 0 0 1px rgb(72 75 106 / 12%)',
  '--mito-theme-toolbar-menu-background': '#ffffff',
  '--mito-theme-toolbar-menu-border': '#d2d3db',
  '--mito-theme-toolbar-menu-shadow':
    '0 16px 40px rgb(72 75 106 / 8%), 0 2px 6px rgb(72 75 106 / 4%)',
  '--mito-theme-toolbar-primary-text': '#484b6a',
  '--mito-theme-toolbar-secondary-text': '#9394a5',
  '--mito-theme-toolbar-muted-text': '#9394a5',
  '--mito-theme-toolbar-accent-text': '#484b6a',
  '--mito-theme-toolbar-accent-hover-text': '#5a5d7a',
  '--mito-theme-toolbar-accent-background': '#e4e5f1',
  '--mito-theme-toolbar-divider': '#d2d3db',
  '--mito-theme-toolbar-focus-outline': '#9394a5',
  '--mito-theme-toolbar-warning': '#9394a5',
  '--mito-theme-toolbar-primary-btn-background': '#484b6a',
  '--mito-theme-toolbar-primary-btn-hover-background': '#5a5d7a',
  '--mito-theme-toolbar-primary-btn-border': '#484b6a',
  '--mito-theme-toolbar-primary-btn-text': '#ffffff',
  '--mito-theme-toolbar-primary-btn-divider': 'rgb(255 255 255 / 18%)',
  '--mito-theme-toolbar-primary-btn-shadow': '0 1px 0 rgb(72 75 106 / 20%)',

  '--mito-theme-vega-background': '#ffffff'
};

export const LAVENDER_THEME_BODY_ATTR = 'data-mito-theme';
export const LAVENDER_THEME_BODY_VALUE = 'lavender';
