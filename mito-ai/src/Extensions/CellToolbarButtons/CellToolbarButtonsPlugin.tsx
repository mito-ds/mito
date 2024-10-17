import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
  } from '@jupyterlab/application';
  import { INotebookTracker } from '@jupyterlab/notebook';
  import { markdownIcon, runIcon } from '@jupyterlab/ui-components';
  
  const CommandIds = {
    /**
     * Command to render a markdown cell.
     */
    renderMarkdownCell: 'toolbar-button:render-markdown-cell',
    /**
     * Command to run a code cell.
     */
    runCodeCell: 'toolbar-button:run-code-cell'
  };
  
  /**
   * Initialization data for the @jupyterlab-examples/cell-toolbar extension.
   */
  const CellToolbarButtonsPlugin: JupyterFrontEndPlugin<void> = {
    // Important: The Cell Toolbar Buttons are added to the toolbar registry via the schema/plugin.json file.
    // The id here must be mito-ai:plugin otherwise the buttons are not successfull added. My understanding is that
    // the id must match the name of the package and `plugin` must be used when working with the schema/plugin.json file.
    id: 'mito-ai:plugin',
    description: 'A JupyterLab extension to add cell toolbar buttons.',
    autoStart: true,
    requires: [INotebookTracker],
    activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
      const { commands } = app;

      console.log("HERE NOW")
  
      /* Adds a command enabled only on code cell */
      commands.addCommand(CommandIds.runCodeCell, {
        icon: runIcon,
        caption: 'Run a code cell',
        execute: () => {
          commands.execute('notebook:run-cell');
        },
        isVisible: () => tracker.activeCell?.model.type === 'code'
      });
  
      /* Adds a command enabled only on markdown cell */
      commands.addCommand(CommandIds.renderMarkdownCell, {
        icon: markdownIcon,
        caption: 'Render a markdown cell',
        execute: () => {
          commands.execute('notebook:run-cell');
        },
        isVisible: () => tracker.activeCell?.model.type === 'markdown'
      });
    }
  };
  
  export default CellToolbarButtonsPlugin;