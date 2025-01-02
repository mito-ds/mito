import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { COMMAND_MITO_AI_OPEN_CHAT, COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE } from '../../commands';
import { lightBulbLabIcon } from '../../icons';

const CellToolbarButtonsPlugin: JupyterFrontEndPlugin<void> = {
    // Important: The Cell Toolbar Buttons are added to the toolbar registry via the schema/cell-toolbar-buttons.json file.
    // The id here must be mito-ai:cell-toolbar-buttons otherwise the buttons are not successfull added. My understanding is that
    // the id must match the name of the package and `cell-toolbar-buttons` must match the name of the .json file.
    id: 'mito-ai:cell-toolbar-buttons',
    description: 'Adds an "explain code cell with AI" button to the cell toolbar',
    autoStart: true,
    requires: [INotebookTracker],
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
        const { commands } = app;

        // Important: To add a button to the cell toolbar, the command must start with "toolbar-button:"
        // and the command must match the command in the schema/plugin.json file.
        commands.addCommand('toolbar-button:explain-code', {
            icon: lightBulbLabIcon,
            caption: 'Explain code in AI Chat',
            execute: () => {
                /* 
                    In order to click on the cell toolbar button, that cell must be the active cell, 
                    so the ChatHistoryManager will take care of providing the cell context.
                */
                app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT)
                app.commands.execute(COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE);
            },
            isVisible: () => notebookTracker.activeCell?.model.type === 'code' && app.commands.hasCommand(COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE)
        });
        console.log("mito-ai: CellToolbarButtonsPlugin activated");
    }
};

export default CellToolbarButtonsPlugin;