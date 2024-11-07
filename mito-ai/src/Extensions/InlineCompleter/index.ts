import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { ICompletionProviderManager } from '@jupyterlab/completer';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { MitoAIInlineCompleter } from './provider';

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
    languageRegistry: IEditorLanguageRegistry
  ) => {
    if (typeof completionManager.registerInlineProvider === 'undefined') {
      // Gracefully short-circuit on JupyterLab 4.0 and Notebook 7.0
      console.warn(
        'Inline completions are only supported in JupyterLab 4.1+ and Jupyter Notebook 7.1+'
      );
      return;
    }

    // Register the Mito AI inline completer
    const provider = new MitoAIInlineCompleter({
      languageRegistry,
      serverSettings: app.serviceManager.serverSettings
    });
    completionManager.registerInlineProvider(provider);
  }
};
