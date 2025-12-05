// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module mito-theme-extension
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';

/**
 * A plugin for the Mito Light Theme.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:theme',
  description: 'Adds the Mito Light theme.',
  requires: [IThemeManager, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    manager: IThemeManager,
    translator: ITranslator
  ) => {
    const trans = translator.load('jupyterlab');
    const style = 'mito_ai/index.css';
    manager.register({
      name: 'Mito Light',
      displayName: trans.__('Mito Light'),
      isLight: true,
      themeScrollbars: false,
      load: () => manager.loadCSS(style),
      unload: () => Promise.resolve(undefined)
    });
  },
  autoStart: true
};

export default plugin;
