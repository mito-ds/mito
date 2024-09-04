import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { buildChatSidebar } from './ChatSidebar';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';


import errorPlugin from './ErrorMimeRenderPlugin';

/**
 * Initialization data for the mito-ai extension.
 */
const aiChatPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:plugin',
  description: 'AI chat for JupyterLab',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IRenderMimeRegistry],
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd, 
    notebookTracker: INotebookTracker, 
    palette: ICommandPalette, 
    rendermime: IRenderMimeRegistry,
    restorer: ILayoutRestorer | null
  ) => {

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const chatWidget = buildChatSidebar(notebookTracker, rendermime)
      return chatWidget
    }

    let widget = newWidget();

    // Add an application command
    const command: string = 'mito_ai:open';
    app.commands.addCommand(command, {
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
        
        // Set focus on the chat input and scroll it to 3/4 of the way down the screen
        const chatInput: HTMLTextAreaElement | null = widget.node.querySelector('.chat-input');
        chatInput?.focus();

        if (chatInput && args?.error) {
          const error = args.error;
          const prompt = `My code generated this error
          
\`\`\`
${error.toString()}
\`\`\`

Please suggest a concise solution`;
          chatInput.value = prompt

          // Then expand the chat input to show the full prompt
          chatInput.style.height = 'auto';
          chatInput.style.height = `${chatInput.scrollHeight}px`;
        }
      }
    });

    app.commands.addKeyBinding({
      command: command,
      keys: ['Accel E'],
      selector: 'body',
    });

    app.shell.add(widget, 'left', { rank: 2000 });

    // Add the command to the palette.
    palette.addItem({ command, category: 'AI Chat' });

    // Track and restore the widget state
    let tracker = new WidgetTracker({
      namespace: widget.id
    });

    if (restorer) {
      restorer.add(widget, 'mito_ai');
    }
  }
};

export default [aiChatPlugin, errorPlugin];
