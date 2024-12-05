import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Notification } from '@jupyterlab/apputils';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { ICompletionProviderManager } from '@jupyterlab/completer';
import { ConfigSection } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MitoAIInlineCompleter } from './provider';

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

const JUPYTERLAB_INLINE_COMPLETER_ID =
  '@jupyterlab/completer-extension:inline-completer';
export const completionPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:inline-completion',
  autoStart: true,
  requires: [
    ICompletionProviderManager,
    IEditorLanguageRegistry,
    ISettingRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    completionManager: ICompletionProviderManager,
    languageRegistry: IEditorLanguageRegistry,
    settingRegistry: ISettingRegistry
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
    ConfigSection.create({
      name: CONFIG_SECTION,
      serverSettings: app.serviceManager.serverSettings
    })
      .then(async config => {
        const state = (config?.data as any as IMitoAIConfig | undefined)?.[
          'state'
        ];
        if (!state?.settingsChecked) {
          const checkSettings = async () => {
            const providers = (
              await settingRegistry.get(
                JUPYTERLAB_INLINE_COMPLETER_ID,
                'providers'
              )
            ).composite as any;

            const updateConfig = () => {
              // Set the settingsChecked flag to true
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
              Notification.info(
                'Thanks for installing the Mito AI extension. Do you want to enable the Mito AI inline completer?',
                {
                  autoClose: false,
                  actions: [
                    {
                      label: 'Enable',
                      displayType: 'accent',
                      callback: async () => {
                        if (
                          providers['@jupyterlab/inline-completer:history']?.[
                            'enabled'
                          ] !== false
                        ) {
                          providers['@jupyterlab/inline-completer:history'][
                            'enabled'
                          ] = false;
                        }
                        providers['mito-ai']['enabled'] = true;
                        await settingRegistry.set(
                          JUPYTERLAB_INLINE_COMPLETER_ID,
                          'providers',
                          providers
                        );
                        updateConfig();
                      }
                    },
                    {
                      label: 'Not now',
                      callback: () => {
                        updateConfig();
                      }
                    }
                  ]
                }
              );
            } else {
              updateConfig();
            }
          };

          if (JUPYTERLAB_INLINE_COMPLETER_ID in settingRegistry.plugins) {
            await checkSettings();
          } else {
            const watchSettings = async (
              registry: ISettingRegistry,
              id: string
            ) => {
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
      languageRegistry,
      serverSettings: app.serviceManager.serverSettings
    });
    completionManager.registerInlineProvider(provider);
  }
};
