import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, MainAreaWidget, WidgetTracker } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';

/**
 * Initialization data for the ai-chat extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ai-chat:plugin',
  description: 'AI chat for JupyterLab',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILayoutRestorer],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer | null) => {
    console.log('JupyterLab extension ai-chat is activated!');
    console.log("ICommandPalette", palette)

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const content = new Widget();
      const widget = new MainAreaWidget({ content });
      widget.id = 'ai-chat-jupyterlab';
      widget.title.label = 'Astronomy Picture';
      widget.title.closable = true;

      // Add an image element to the content
      let text = document.createElement('p')
      text.textContent = "Hello, world!";
      widget.node.appendChild(text);

      return widget;
    }

    let widget = newWidget();

    // Add an application command
    const command: string = 'ai-chat:open';
    app.commands.addCommand(command, {
      label: 'Random Astronomy Picture',
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

    // Add the command to the palette.
    palette.addItem({ command, category: 'Tutorial' });

    // Track and restore the widget state
    let tracker = new WidgetTracker({
      namespace: widget.id
    });

    // Restore the widget state
    if (restorer) {
      restorer.restore(tracker, {
        command,
        name: () => widget.id
      });
    }
  }
};

export default plugin;
