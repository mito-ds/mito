/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { buildChatWidget, type ChatWidget } from './ChatWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { IChatTracker } from './token';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';

// The Widget Rank determins where the ChatIcon is displayed
// in the left hand toolbar
const WIDGET_RANK = 2000


/**
 * Initialization data for the mito-ai extension.
 */
const AiChatPlugin: JupyterFrontEndPlugin<WidgetTracker> = {
  id: 'mito_ai:chat',
  description: 'AI chat for JupyterLab',
  autoStart: true,
  requires: [
    ILabShell,
    INotebookTracker,
    ICommandPalette,
    IRenderMimeRegistry,
    IContextManager
  ],
  optional: [ILayoutRestorer],
  provides: IChatTracker,
  activate: (
    app: JupyterFrontEnd,
    labShell: ILabShell,
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

        // Step 3: Attatch the widget to the app if its not already there
        if (!widget.isAttached) {
          void app.shell.add(widget, 'left', { rank: WIDGET_RANK });
        }

        // Now that the widget is added to the shell, activating it will open the taskpane
        app.shell.activateById(widget.id);

        // If the command is called with focus on chat input set to false, 
        // don't focus. This is useful when we don't want to active cell 
        // preview to be displayed when using the smart debugger.
        if (args?.focusChatInput === false) {
          return;
        }

        // Set focus on the chat input
        const chatInput: HTMLTextAreaElement | null = widget.node.querySelector('.chat-input');
        chatInput?.focus();
      }
    });

    app.commands.addKeyBinding({
      command: COMMAND_MITO_AI_OPEN_CHAT,
      keys: ['Accel E'],
      selector: 'body'
    });

    app.shell.add(widget, 'left', { rank: WIDGET_RANK });

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
    
    // Instead of immediately activating the chat widget, wait for app restoration to complete
    // This ensures our widget activation happens after JupyterLab's initial setup which by 
    // default tries to open the file browser instead. 
    // TODO: It might be nice to only open to chat if a notebook is already open. If a 
    // notebook is not already open, then users might want to open to the file browser, 
    void app.restored.then(() => {
      // Activate our chat widget after JupyterLab has fully initialized
      // This will override the default file browser selection
      labShell.activateById(widget.id);
    });

    // By returning a tracker token, we can require the token in other 
    // plugins. This allows us to force plugin load order. For example, 
    // we can ensure that the COMMAND_MITO_AI_OPEN_CHAT is created 
    // before trying to use it in other plugins
    return tracker;
  }
};

export default AiChatPlugin;
