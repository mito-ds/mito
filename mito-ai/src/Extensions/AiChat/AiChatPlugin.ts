import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { buildChatWidget } from './ChatWidget';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { IVariableManager } from '../VariableManager/VariableManagerPlugin';
import { COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';
import { IChatTracker } from './token';


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
    IVariableManager,
  ],
  optional: [ILayoutRestorer],
  provides: IChatTracker,
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette,
    rendermime: IRenderMimeRegistry,
    variableManager: IVariableManager,
    restorer: ILayoutRestorer | null
  ) => {
    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const chatWidget = buildChatWidget(
        app,
        notebookTracker,
        rendermime,
        variableManager,
      );
      return chatWidget;
    };

    let widget = newWidget();

    // Add an application command
    app.commands.addCommand(COMMAND_MITO_AI_OPEN_CHAT, {
      label: 'Your friendly Python Expert chat bot',
      execute: () => {
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
          tracker.add(widget);
        }

        // Step 3: Attatch the widget to the app if its not
        // already there
        if (!widget.isAttached) {
          app.shell.add(widget, 'left', { rank: 2000 });
        }

        // Now that the widget is potentially accessible, activating the
        // widget opens the taskpane
        app.shell.activateById(widget.id);

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
    const tracker = new WidgetTracker({
      namespace: widget.id
    });

    if (restorer) {
      restorer.add(widget, 'mito_ai');
    }

    // This allows us to force plugin load order
    console.log("mito-ai: AiChatPlugin activated");
    return tracker;
  }
};

export default AiChatPlugin;
