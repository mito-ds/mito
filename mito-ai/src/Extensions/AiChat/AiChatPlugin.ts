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
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { IChatTracker } from './token';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';

// The Widget Rank determins where the ChatIcon is displayed
// in the left hand toolbar
const WIDGET_RANK = 1


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
    IContextManager,
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
          console.log(1)
          widget = newWidget();
        }

        // Step 2: Add the widget to the widget tracker if
        // its not already there
        if (!tracker.has(widget)) {
          console.log(2)
          void tracker.add(widget);
        }

        // Step 3: Attatch the widget to the app if its not already there
        if (!widget.isAttached) {
          console.log(3)
          void app.shell.add(widget, 'left', { rank: WIDGET_RANK });
        }

        // Now that the widget is added to the shell, activating it will open the taskpane
        console.log(4)
        app.shell.activateById(widget.id);

        // If the command is called with focus on chat input set to false, 
        // don't focus. This is useful when we don't want to active cell 
        // preview to be displayed when using the smart debugger.
        if (args?.focusChatInput === false) {
          console.log(5)
          return;
        }

        console.log(6)
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

    app.shell.activateById(widget.id);

    console.log('Battatched: ', widget.isAttached)
    console.log('Bvisible: ', widget.isVisible)
    console.log('widget id', widget.id)
    if (widget.id) {
      console.log("activging!!!!")
      app.shell.activate()
    }

    console.log('Aattatched: ', widget.isAttached)
    console.log('Avisible: ', widget.isVisible)

    console.log("mito-ai: AiChatPlugin activated");

    console.log('active widget', labShell.activeWidget)
    console.log(widget)
    widget.activate()
    labShell.activateById(widget.id)
    labShell.collapseLeft()
    console.log('active widget', labShell.activeWidget)


    // By returning a tracker token, we can require the token in other 
    // plugins. This allows us to force plugin load order. For example, 
    // we can ensure that the COMMAND_MITO_AI_OPEN_CHAT is created 
    // before trying to use it in other plugins

    console.log(notebookTracker.activeCell)

    console.log("WIDETS")
    console.log(labShell.widgets('menu'))

    // Automatically open the app chat sidebar! 
    app.restored.then(() => {
      labShell.activateById(widget.id);
    });

    return tracker;
  }
};

export default AiChatPlugin;
