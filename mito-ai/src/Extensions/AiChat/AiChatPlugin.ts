/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { buildChatWidget, type ChatWidget } from './ChatWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { IChatTracker } from './token';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';


/**
 * Initialization data for the mito-ai extension.
 */
const AiChatPlugin: JupyterFrontEndPlugin<WidgetTracker> = {
  id: 'mito_ai:chat',
  description: 'AI chat for JupyterLab',
  autoStart: true,
  requires: [
    INotebookTracker,
    ICommandPalette,
    IRenderMimeRegistry,
    IContextManager,
  ],
  optional: [ILayoutRestorer],
  provides: IChatTracker,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    contextManager: IContextManager,
    restorer: ILayoutRestorer | null,
  ): WidgetTracker<ChatWidget> => {
    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = (): ChatWidget => {
      // Create a blank content widget inside of a MainAreaWidget
      const chatWidget = buildChatWidget(
        app,
        notebookTracker,
        rendermime,
        contextManager,
      );
      return chatWidget;
    };

    let widget = newWidget();

    // Add an application command
    app.commands.addCommand(COMMAND_MITO_AI_OPEN_CHAT, {
      label: 'Your friendly Python Expert chat bot',
      execute: (args?: ReadonlyPartialJSONObject) => {
        // In order for the widget to be accessible, the widget must be:
        // 1. Created
        // 2. Added to the widget tracker
        // 3. Attatched to the frontend

        // Step 1: Create the widget if its not already created
        if (!widget || widget.isDisposed) {
          widget = newWidget();
        }

        // Step 2: Add the widget to the widget tracker if
        // its not already there
        if (!tracker.has(widget)) {
          void tracker.add(widget);
        }

        // Step 3: Attatch the widget to the app if its not
        // already there
        if (!widget.isAttached) {
          void app.shell.add(widget, 'left', { rank: 2000 });
        }

        // Now that the widget is potentially accessible, activating the
        // widget opens the taskpane
        app.shell.activateById(widget.id);


        // If the command is called with focus on chat input set to false, 
        // don't focus. This is useful when we don't want to active cell 
        // preview to be displayed when using the smart debugger.
        if (args?.focusChatInput === false) {
          return;
        }

        // Set focus on the chat input
        const chatInput: HTMLTextAreaElement | null =
          widget.node.querySelector('.chat-input');
        chatInput?.focus();
      }
    });

    app.commands.addKeyBinding({
      command: COMMAND_MITO_AI_OPEN_CHAT,
      keys: ['Accel E'],
      selector: 'body'
    });

    app.shell.add(widget, 'left', { rank: 2000 });

    // Add the command to the palette.
    palette.addItem({
      command: COMMAND_MITO_AI_OPEN_CHAT,
      category: 'AI Chat'
    });

    // Track and restore the widget state
    const tracker = new WidgetTracker<ChatWidget>({
      namespace: widget.id
    });
    if (!tracker.has(widget)) {
      void tracker.add(widget);
    }

    if (restorer) {
      restorer.add(widget, 'mito_ai');
    }

    // This allows us to force plugin load order
    console.log("mito-ai: AiChatPlugin activated");
    return tracker;
  }
};

export default AiChatPlugin;
