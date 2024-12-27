import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IThemeManager } from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the mitoThemeLight extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mitoThemeLight:plugin',
  description: 'A new look for Jupyter Lab',
  autoStart: true,
  requires: [IThemeManager],
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, manager: IThemeManager, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension mitoThemeLight is activated!');
    const style = 'mitoThemeLight/index.css';

    manager.register({
      name: 'mitoThemeLight',
      isLight: true,
      load: () => manager.loadCSS(style),
      unload: () => Promise.resolve(undefined)
    });

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('mitoThemeLight settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for mitoThemeLight.', reason);
        });
    }
  }
};

export default plugin;
