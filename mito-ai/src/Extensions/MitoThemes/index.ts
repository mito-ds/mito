/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module mito-themes-extension
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { enableLineNumbersIfNeeded } from '../../utils/lineNumbers';
import { MitoPalettes } from './palettes';
import { LAVENDER_THEME_BODY_VALUE } from './lavenderPalette';
import { OPTO_THEME_BODY_VALUE } from './optoPalette';

const MITO_THEME_NAMES = ['Mito Light', 'Mito Dark', 'Opto', 'Lavender'] as const;

const THEME_BODY_ATTR = 'data-mito-theme';

const THEME_BODY_VALUES: Record<string, string> = {
  Opto: OPTO_THEME_BODY_VALUE,
  Lavender: LAVENDER_THEME_BODY_VALUE
};

const isMitoThemeName = (themeName: string | null): boolean =>
  themeName !== null &&
  (MITO_THEME_NAMES as readonly string[]).includes(themeName);

const setThemeBodyAttribute = (themeName: string | null): void => {
  const themeValue =
    themeName !== null ? THEME_BODY_VALUES[themeName] ?? null : null;
  if (themeValue) {
    document.body.setAttribute(THEME_BODY_ATTR, themeValue);
  } else {
    document.body.removeAttribute(THEME_BODY_ATTR);
  }
};

/**
 * Updates cell numbers for all cells in a notebook.
 * Uses notebook.widgets which is always in the correct order.
 */
function updateAllCellNumbers(notebookPanel: NotebookPanel): void {
  const notebook = notebookPanel.content;
  notebook.widgets.forEach((cell, index) => {
    const header = cell.node.querySelector('.jp-Cell-header');
    if (header) {
      // 1-indexed for display (Cell 1, Cell 2, etc.)
      header.setAttribute('data-cell-number', String(index + 1));
    }
  });
}

/**
 * Sets up cell numbering for a notebook panel.
 * Returns cleanup function to disconnect handlers.
 */
function setupCellNumbering(notebookPanel: NotebookPanel): (() => void) | null {
  const notebook = notebookPanel.content;

  // Store handler references so they can be disconnected on cleanup
  const handleCellsChanged = (): void => {
    updateAllCellNumbers(notebookPanel);
  };

  const handleActiveCellChanged = (): void => {
    updateAllCellNumbers(notebookPanel);
  };

  // Update when cells are added, removed, or moved
  notebook.model?.cells.changed.connect(handleCellsChanged);

  // Update when active cell changes (often happens when scrolling)
  notebook.activeCellChanged.connect(handleActiveCellChanged);

  // Use MutationObserver to handle virtualization (cells being attached/detached)
  const observer = new MutationObserver(() => {
    updateAllCellNumbers(notebookPanel);
  });
  observer.observe(notebook.node, { childList: true, subtree: true });

  // Initial update
  updateAllCellNumbers(notebookPanel);

  // Return cleanup function
  return () => {
    notebook.model?.cells.changed.disconnect(handleCellsChanged);
    notebook.activeCellChanged.disconnect(handleActiveCellChanged);
    observer.disconnect();
    // Remove cell numbers from all cells
    notebook.widgets.forEach((cell) => {
      const header = cell.node.querySelector('.jp-Cell-header');
      if (header) {
        header.removeAttribute('data-cell-number');
      }
    });
  };
}

/**
 * A plugin for the Mito Themes (Light, Dark, Opto, and Lavender).
 *
 * Registers Mito Light, Mito Dark, Opto, and Lavender themes.
 * Cell numbering and hidden default toolbar buttons apply when any Mito theme
 * is active.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:themes',
  description: 'Adds the Mito Light, Dark, Opto, and Lavender themes.',
  requires: [IThemeManager, ITranslator, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    manager: IThemeManager,
    translator: ITranslator,
    notebookTracker: INotebookTracker
  ) => {
    const trans = translator.load('jupyterlab');
    
    // CSS path - single CSS file for both themes (uses CSS variables set by palettes)
    const style = 'mito_ai/index.css';
    const palettes = new MitoPalettes();
    
    // Store connections for cleanup
    let lightWidgetAddedConnection: ((sender: INotebookTracker, widget: NotebookPanel) => void) | null = null;
    let darkWidgetAddedConnection: ((sender: INotebookTracker, widget: NotebookPanel) => void) | null = null;
    let optoWidgetAddedConnection: ((sender: INotebookTracker, widget: NotebookPanel) => void) | null = null;
    let lavenderWidgetAddedConnection: ((sender: INotebookTracker, widget: NotebookPanel) => void) | null = null;
    
    // Store cell numbering cleanup functions for each notebook
    const cellNumberingCleanups = new Map<NotebookPanel, () => void>();

    // Remove cell numbering from a notebook panel
    const removeCellNumbering = (notebookPanel: NotebookPanel): void => {
      const cleanup = cellNumberingCleanups.get(notebookPanel);
      if (cleanup) {
        cleanup();
        cellNumberingCleanups.delete(notebookPanel);
      }
    };

    // Add cell numbering to a notebook panel (guard against duplicates)
    const addCellNumbering = (notebookPanel: NotebookPanel): void => {
      if (cellNumberingCleanups.has(notebookPanel)) {
        return;
      }
      const cleanup = setupCellNumbering(notebookPanel);
      if (cleanup) {
        cellNumberingCleanups.set(notebookPanel, cleanup);
        // Also cleanup when notebook is disposed
        notebookPanel.disposed.connect(() => {
          cellNumberingCleanups.delete(notebookPanel);
        });
      }
    };

    // Add Mito theme notebook enhancements to all notebooks (for a specific theme)
    const addThemeEnhancementsToAllNotebooks = (themeName: string): void => {
      notebookTracker.forEach(widget => {
        // Enable line numbers if needed
        void enableLineNumbersIfNeeded(app, widget);
        // Setup cell numbering
        addCellNumbering(widget);
      });

      // Connect to new notebooks
      const widgetAddedHandler = (sender: INotebookTracker, widget: NotebookPanel): void => {
        setTimeout(() => {
          // Check if widget is still valid before proceeding
          if (widget.isDisposed) {
            return;
          }
          // Only add if the specified theme is still active
          if (manager.theme === themeName) {
            // Enable line numbers if needed
            void enableLineNumbersIfNeeded(app, widget);
            // Setup cell numbering
            addCellNumbering(widget);
          }
        }, 100);
      };

      if (themeName === 'Mito Light') {
        lightWidgetAddedConnection = widgetAddedHandler;
        notebookTracker.widgetAdded.connect(lightWidgetAddedConnection);
      } else if (themeName === 'Mito Dark') {
        darkWidgetAddedConnection = widgetAddedHandler;
        notebookTracker.widgetAdded.connect(darkWidgetAddedConnection);
      } else if (themeName === 'Opto') {
        optoWidgetAddedConnection = widgetAddedHandler;
        notebookTracker.widgetAdded.connect(optoWidgetAddedConnection);
      } else if (themeName === 'Lavender') {
        lavenderWidgetAddedConnection = widgetAddedHandler;
        notebookTracker.widgetAdded.connect(lavenderWidgetAddedConnection);
      }
    };

    // Remove Mito theme notebook enhancements from all notebooks
    const removeThemeEnhancementsFromAllNotebooks = (): void => {
      // Disconnect from new notebooks
      if (lightWidgetAddedConnection) {
        notebookTracker.widgetAdded.disconnect(lightWidgetAddedConnection);
        lightWidgetAddedConnection = null;
      }
      if (darkWidgetAddedConnection) {
        notebookTracker.widgetAdded.disconnect(darkWidgetAddedConnection);
        darkWidgetAddedConnection = null;
      }
      if (optoWidgetAddedConnection) {
        notebookTracker.widgetAdded.disconnect(optoWidgetAddedConnection);
        optoWidgetAddedConnection = null;
      }
      if (lavenderWidgetAddedConnection) {
        notebookTracker.widgetAdded.disconnect(lavenderWidgetAddedConnection);
        lavenderWidgetAddedConnection = null;
      }

      setThemeBodyAttribute(null);

      // Remove from all existing notebooks
      notebookTracker.forEach(widget => {
        removeCellNumbering(widget);
      });
      
      // Clear all cleanup functions
      cellNumberingCleanups.clear();
    };

    // Register Mito Light theme
    manager.register({
      name: 'Mito Light',
      displayName: trans.__('Mito Light'),
      isLight: true,
      themeScrollbars: false,
      load: async () => {
        setThemeBodyAttribute(null);
        // Set CSS variables for light theme before loading CSS
        palettes.setColorsLight();
        // Load theme CSS (hides default buttons, applies light theme variables)
        await manager.loadCSS(style);
        // Enable line numbers and cell numbering in all notebooks
        addThemeEnhancementsToAllNotebooks('Mito Light');
      },
      unload: async () => {
        // Remove line numbers and cell numbering from all notebooks
        removeThemeEnhancementsFromAllNotebooks();
      }
    });

    // Register Mito Dark theme
    manager.register({
      name: 'Mito Dark',
      displayName: trans.__('Mito Dark'),
      isLight: false,
      themeScrollbars: false,
      load: async () => {
        setThemeBodyAttribute(null);
        // Set CSS variables for dark theme before loading CSS
        palettes.setColorsDark();
        // Load theme CSS (hides default buttons, applies dark theme variables)
        await manager.loadCSS(style);
        // Enable line numbers and cell numbering in all notebooks
        addThemeEnhancementsToAllNotebooks('Mito Dark');
      },
      unload: async () => {
        // Remove line numbers and cell numbering from all notebooks
        removeThemeEnhancementsFromAllNotebooks();
      }
    });

    // Register Opto theme (institutional green light theme)
    manager.register({
      name: 'Opto',
      displayName: trans.__('Opto'),
      isLight: true,
      themeScrollbars: false,
      load: async () => {
        palettes.setColorsOpto();
        setThemeBodyAttribute('Opto');
        await manager.loadCSS(style);
        addThemeEnhancementsToAllNotebooks('Opto');
      },
      unload: async () => {
        removeThemeEnhancementsFromAllNotebooks();
      }
    });

    // Register Lavender theme (cool lavender-gray light theme)
    manager.register({
      name: 'Lavender',
      displayName: trans.__('Lavender'),
      isLight: true,
      themeScrollbars: false,
      load: async () => {
        palettes.setColorsLavender();
        setThemeBodyAttribute('Lavender');
        await manager.loadCSS(style);
        addThemeEnhancementsToAllNotebooks('Lavender');
      },
      unload: async () => {
        removeThemeEnhancementsFromAllNotebooks();
      }
    });

    // Flag to prevent infinite recursion when we convert themes
    let isConvertingTheme = false;

    // Helper function to convert non-Mito themes to corresponding Mito theme
    const convertToMitoTheme = (themeName: string | null): void => {
      // Prevent infinite recursion - if we're already converting, don't do it again
      if (isConvertingTheme) {
        return;
      }

      if (!themeName) {
        // No theme set, default to Mito Light
        isConvertingTheme = true;
        void manager.setTheme('Mito Light').finally(() => {
          isConvertingTheme = false;
        });
        return;
      }

      if (isMitoThemeName(themeName)) {
        // Already a Mito theme, don't change - this ensures user's Mito theme preference is preserved
        return;
      }

      // Convert non-Mito themes to corresponding Mito theme
      isConvertingTheme = true;
      if (themeName === 'JupyterLab Dark' || themeName.includes('Dark')) {
        void manager.setTheme('Mito Dark').finally(() => {
          isConvertingTheme = false;
        });
      } else {
        // Default to light theme for any other non-Mito theme (including JupyterLab Light)
        void manager.setTheme('Mito Light').finally(() => {
          isConvertingTheme = false;
        });
      }
    };

    // Wait for app restoration to complete before checking/setting theme
    // This ensures saved theme preferences are loaded first
    void app.restored.then(() => {
      // Convert theme on initial load if needed
      convertToMitoTheme(manager.theme);
    });

    // Listen for theme changes and automatically convert to Mito theme
    // This ensures that when users switch themes, they get converted to Mito themes
    // and the preference is saved properly
    manager.themeChanged.connect(() => {
      // Use manager.theme to get the current theme after the change
      convertToMitoTheme(manager.theme);
    });
  },
  autoStart: true
};

export default plugin;
