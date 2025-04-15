/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import type { WidgetTracker } from '@jupyterlab/apputils';
import type { ICellModel } from '@jupyterlab/cells';
import { IEditorMimeTypeService } from '@jupyterlab/codeeditor';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';
import { CommandRegistry } from '@lumino/commands';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { IChatTracker } from '../AiChat/token';
import { advicePlugin } from './emptyCell';

export const emptyCellPlaceholder: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:empty-cell-placeholder',
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
    const pythonAdvice = `Start writing python or Press ${CommandRegistry.formatKeystroke(
      keyBindings?.keys[0] ?? 'Accel E'
    )
      .split(/[+\s]/)
      .map(s => `<kbd>${s}</kbd>`)
      .join(' + ')} to ask Mito AI to write code for you.`;
    extensions.addExtension({
      name: 'mito-ai:empty-editor-advice',
      factory: options => {
        let advice = ''; // Default advice
        // Add the advice only for cells (not for file editor)
        if (options.inline) {
          let guessedMimeType = options.model.mimeType;
          if (
            guessedMimeType === IEditorMimeTypeService.defaultMimeType &&
            (options.model as ICellModel).type === 'code'
          ) {
            // Assume the kernel is not yet ready and will be a Python one.
            // FIXME it will be better to deal with model.mimeTypeChanged signal
            // but this is gonna be hard.
            guessedMimeType = 'text/x-ipython';
          }
          // Tune the advice with the mimetype
          switch (guessedMimeType) {
            case 'text/x-ipython': // Python code cell
              advice = pythonAdvice;
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
    console.log("mito-ai: EmptyCellPlugin activated");
  }
};
