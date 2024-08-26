import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette, WidgetTracker } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { buildChatSidebar } from './ChatSidebar';
import { IEditorLanguageRegistry } from '@jupyterlab/codemirror';


/**
 * Initialization data for the ai-chat extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ai-chat:plugin',
  description: 'AI chat for JupyterLab',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IEditorLanguageRegistry],
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd, 
    notebookTracker: INotebookTracker, 
    palette: ICommandPalette, 
    languageRegistry: IEditorLanguageRegistry,
    restorer: ILayoutRestorer | null
  ) => {

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const chatWidget = buildChatSidebar(notebookTracker, languageRegistry)
      return chatWidget
    }

    let widget = newWidget();

    // Add an application command
    const command: string = 'ai-chat:open';
    app.commands.addCommand(command, {
      label: 'Your friendly Python Expert chat bot',
      execute: () => {
        // Regenerate the widget if disposed
        if (!widget ||widget.isDisposed) {
          widget = newWidget();
          widget
        }
        if (!tracker.has(widget)) {
          tracker.add(widget);
        }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    app.shell.add(widget, 'left', { rank: 2000 });

    // Add the command to the palette.
    palette.addItem({ command, category: 'AI Chat' });

    // Track and restore the widget state
    let tracker = new WidgetTracker({
      namespace: widget.id
    });

    if (restorer) {
      restorer.add(widget, 'ai-chat');
    }
  }
};

export default plugin;
