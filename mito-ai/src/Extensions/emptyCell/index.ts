import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import { advicePlugin } from './emptyCell';
import { CommandRegistry } from '@lumino/commands';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';

export const localPrompt: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:empty-editor-advice',
  description: 'Add a local prompt to editor.',
  autoStart: true,
  requires: [IEditorExtensionRegistry],
  activate: (
    app: JupyterFrontEnd,
    extensions: IEditorExtensionRegistry
  ): void => {
    const keyBindings = app.commands.keyBindings.find(
      b => b.command === COMMAND_MITO_AI_OPEN_CHAT
    );
    extensions.addExtension({
      name: 'mito-ai:empty-editor-advice',
      factory: () =>
        EditorExtensionRegistry.createImmutableExtension(
          advicePlugin({
            shortcut: keyBindings?.keys.map(CommandRegistry.formatKeystroke)
          })
        )
    });
  }
};
