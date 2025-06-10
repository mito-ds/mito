/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Notification } from '@jupyterlab/apputils';
import { ICompletionProviderManager } from '@jupyterlab/completer';
import { ConfigSection } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MitoAIInlineCompleter } from './provider';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { logEvent } from '../../restAPI/RestAPI';

/**
 * Interface for the Mito AI configuration settings.
 */
interface IMitoAIConfig {
  state: {
    /**
     * Whether the settings have been checked or not.
     */
    settingsChecked: boolean;
  };
}

const JUPYTERLAB_INLINE_COMPLETER_ID = '@jupyterlab/completer-extension:inline-completer';
const JUPYTERLAB_SHORTCUTS_ID = '@jupyterlab/shortcuts-extension:shortcuts';
export const completionPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:inline-completion',
  autoStart: true,
  requires: [
    ICompletionProviderManager,
    ISettingRegistry,
    IContextManager,
  ],
  activate: (
    app: JupyterFrontEnd,
    completionManager: ICompletionProviderManager,
    settingRegistry: ISettingRegistry,
    contextManager: IContextManager,
  ) => {
    if (typeof completionManager.registerInlineProvider === 'undefined') {
      // Gracefully short-circuit on JupyterLab 4.0 and Notebook 7.0
      console.warn(
        'Inline completions are only supported in JupyterLab 4.1+ and Jupyter Notebook 7.1+'
      );
      return;
    }

    // Only alphanumeric characters are authorized for configuration section
    const CONFIG_SECTION = 'mitoaiconfig';

    // Use Jupyter Server configuration to check if this is the first time the extension is installed.
    // Jupyter Server configuration are stored in the $HOME/.jupyter/serverconfig folder as JSON files.
    // If the user click on "Enable" or "Not now" button in the notification, the configuration will
    // be changed to contain `{settingsChecked: true}` to prevent notifying the user at later launches.
    ConfigSection.create({
      name: CONFIG_SECTION,
      serverSettings: app.serviceManager.serverSettings
    })
      .then(async config => {
        const state = (config?.data as any as IMitoAIConfig | undefined)?.[
          'state'
        ];
        // Check if the user has acknowledge the notification before;
        // aka if the settingsChecked flag is set to true.
        if (!state?.settingsChecked) {
          const checkSettings = async (): Promise<void> => {
            const providers = (
              await settingRegistry.get(
                JUPYTERLAB_INLINE_COMPLETER_ID,
                'providers'
              )
            ).composite as any;

            let shortcuts = (
              await settingRegistry.get(
                JUPYTERLAB_SHORTCUTS_ID,
                'shortcuts'
              )
            ).composite as any;

            const updateConfig = (): void => {
              // Set the settingsChecked flag to true to store
              // that the user has acknowledge the notification.
              config
                .update({ state: { settingsChecked: true } })
                .catch(reason => {
                  console.error(
                    `Failed to update configuration section ${CONFIG_SECTION}.`,
                    reason
                  );
                });
            };

            if (!providers['mito-ai']['enabled']) {

              /* The first time the user installs Mito AI, we take a few actions*/ 

              // 1. Dispaly welcome notification
              Notification.info(
                'Mito AI is now enabled!',
                {
                  autoClose: 10000
                }
              );

              // 2. Disable the default inline completer
              if (providers['@jupyterlab/inline-completer:history']?.['enabled'] !== false) {
                providers['@jupyterlab/inline-completer:history']['enabled'] = false;
              }

              // 3. Enable the Mito AI inline completer
              providers['mito-ai']['enabled'] = true;
              await settingRegistry.set(JUPYTERLAB_INLINE_COMPLETER_ID, 'providers', providers);

              // 4. Set Tab as the accept button for autocomplete.
              // For some reason, it seems that unless the Tab shortcut is registered first, 
              // Jupyter does not accept it. So we try removing the existing shortcut.
              shortcuts = shortcuts.filter((shortcut: {command: string}) => shortcut.command !== 'inline-completer:accept');
              shortcuts.push({
                command: 'inline-completer:accept',
                keys: ['Tab'],
                selector: '.jp-mod-inline-completer-active'
              });
              await settingRegistry.set(
                JUPYTERLAB_SHORTCUTS_ID,
                'shortcuts',
                shortcuts
              );

              updateConfig();
            }
          };

          // Jupyter inline completer settings may not be available yet
          // If they are, we check the settings immediately. Otherwise,
          // we wait for the settings to be available by listening to the
          // settingsRegistry.pluginChanged signal.
          if (JUPYTERLAB_INLINE_COMPLETER_ID in settingRegistry.plugins) {
            await checkSettings();
          } else {
            const watchSettings = async (
              registry: ISettingRegistry,
              id: string
            ): Promise<void> => {
              if (id === JUPYTERLAB_INLINE_COMPLETER_ID) {
                registry.pluginChanged.disconnect(watchSettings);
                await checkSettings();
              }
            };
            settingRegistry.pluginChanged.connect(watchSettings);
          }
        }
      })
      .catch(reason => {
        console.error(
          `Failed to fetch configuration section '${CONFIG_SECTION}'`,
          reason
        );
      });

    // Register the Mito AI inline completer
    const provider = new MitoAIInlineCompleter({
      serverSettings: app.serviceManager.serverSettings,
      contextManager: contextManager
    });
    completionManager.registerInlineProvider(provider);


    // Log when the user accepts an inline completion so we can understand
    // how useful our completions are to the user.
    app.commands.commandExecuted.connect((_, args: {id: string}): void => {
      if (args.id == 'inline-completer:accept') {
        const acceptedCompletionInfo = provider.getCurrentCompletionInfo();
        void logEvent('mito_ai_inline_completion_accepted', acceptedCompletionInfo);
      }
    });
  }
};
