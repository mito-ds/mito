import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import type { WidgetTracker } from '@jupyterlab/apputils';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import { CommandRegistry } from '@lumino/commands';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { IChatTracker } from '../AiChat/token';
import { advicePlugin } from './emptyCell';

export const localPrompt: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:empty-editor-advice',
  description: 'Display a default message in an empty code cell.',
  autoStart: true,
  requires: [IChatTracker, IEditorExtensionRegistry],
  activate: (
    app: JupyterFrontEnd,
    // Trick to ensure the chat plugin is available and loaded before this one
    // so that the keybinding can be properly resolved.
    tracker: WidgetTracker,
    extensions: IEditorExtensionRegistry
  ): void => {
    const keyBindings = app.commands.keyBindings.find(
      b => b.command === COMMAND_MITO_AI_OPEN_CHAT
    );
    extensions.addExtension({
      name: 'mito-ai:empty-editor-advice',
      factory: options => {
        let advice = ''; // Default advice
        // Add the advice only for cells (not for file editor)
        if (options.inline) {
          // Tune the advice with the mimetype
          switch (options.model.mimeType) {
            case 'text/x-ipython': // Python code cell
              advice = `Start writing python or Press ${keyBindings?.keys
                .map(CommandRegistry.formatKeystroke)
                .map(s => `<kbd>${s}</kbd>`)
                .join(' + ')} to ask Mito AI to write code for you.`;
              break;
            case 'text/x-ipythongfm': // Jupyter Markdown cell
              advice = 'Start writing markdown.';
              break;
          }
        }
        return EditorExtensionRegistry.createImmutableExtension(
          advicePlugin({
            advice
          })
        );
      }
    });
  }
};
