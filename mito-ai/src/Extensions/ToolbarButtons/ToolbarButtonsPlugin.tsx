/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { COMMAND_MITO_AI_BETA_MODE_ENABLED, COMMAND_MITO_AI_OPEN_CHAT, COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE } from '../../commands';
import { AppBuilderExcludeCellLabIcon, AppBuilderIncludeCellLabIcon, lightBulbLabIcon } from '../../icons';
import { getActiveCellIncludeInApp, toggleActiveCellIncludeInAppMetadata } from '../../utils/notebook';
import { convertNotebookToStreamlit } from '../AppBuilder/NotebookToStreamlit';
import { IAppBuilderService } from '../AppBuilder/AppBuilderPlugin';
import { getSetting } from '../../restAPI/RestAPI';

const ToolbarButtonsPlugin: JupyterFrontEndPlugin<void> = {
    // Important: The Cell Toolbar Buttons are added to the toolbar registry via the schema/toolbar-buttons.json file.
    // The id here must be mito-ai:toolbar-buttons otherwise the buttons are not successfully added. My understanding is that
    // the id must match the name of the package and `toolbar-buttons` must match the name of the .json file.
    id: 'mito_ai:toolbar-buttons',
    description: 'Adds an "explain code cell with AI" button to the cell toolbar',
    autoStart: true,
    requires: [INotebookTracker],
    optional: [IAppBuilderService],
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker, appBuilderService?: IAppBuilderService) => {
        const { commands } = app;

        // Important: To add a button to the cell toolbar, the command must start with "toolbar-button:"
        // and the command must match the command in the schema/plugin.json file.
        commands.addCommand('toolbar-button:explain-code', {
            icon: lightBulbLabIcon,
            caption: 'Explain code in AI Chat',
            execute: async () => {
                /* 
                    In order to click on the cell toolbar button, that cell must be the active cell, 
                    so the ChatHistoryManager will take care of providing the cell context.
                */
                await app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT)
                await app.commands.execute(COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE);
            },
            isVisible: () => notebookTracker.activeCell?.model.type === 'code' && app.commands.hasCommand(COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE)
        });

        commands.addCommand('toolbar-button:toggle-include-cell-in-app', {
            icon: () => {
                const includeCellInApp = getActiveCellIncludeInApp(notebookTracker);
                return includeCellInApp ? AppBuilderIncludeCellLabIcon : AppBuilderExcludeCellLabIcon;
            },
            caption: 'Toggle cell output visibility in Streamlit app',
            execute: async () => {
                /* 
                In order to click on the cell toolbar button, that cell must be the active cell.

                Currently we mark the entire cell as not included in the app.
                    
                    Future improvement: Allow users to hide only the cell OUTPUT while keeping the code.
                    
                    Implementation challenges:
                    1. Handling displayed expressions: Streamlit automatically displays hanging variables.
                    
                    Potential solutions:
                    - Use linting (pyright/pylance) to detect reportUnusedExpression in cells that have outputs turned off and remove unused expressions 
                    - Use AI to identify and remove hanging variables
                    - Parse code to find and remove lone variable references and literals
                */
                toggleActiveCellIncludeInAppMetadata(notebookTracker);

                // Force command refresh to update the icon
                commands.notifyCommandChanged('toolbar-button:toggle-include-cell-in-app');
            },
            isVisible: () => {
                return app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED);
            }
        });

        commands.addCommand('toolbar-button:convert-to-streamlit', {
            label: 'Deploy App',
            caption: 'Convert to Streamlit',
            className: 'text-button-mito-ai button-base button-purple button-small',
            execute: async () => {
                void convertNotebookToStreamlit(notebookTracker, appBuilderService);
            },
            isVisible: () => {
                // Default to hidden, will be updated after async check since we are not allowed to 
                // use async commands in isVisible.
                return app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED);
            }
        });

        commands.addCommand('toolbar-button:preview-as-streamlit', {
            label: 'Preview App',
            caption: 'Preview as Streamlit',
            className: 'text-button-mito-ai button-base button-purple button-small',
            execute: async () => {
                void app.commands.execute('mito-ai:preview-as-streamlit');
            },
            isVisible: () => {
                return app.commands.hasCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED);
            }
        });

        // Check if the beta mode is enabled. After checking, tell Jupyter to 
        // re-evaluate convert-to-streamlit visibility now that we have had the 
        // opportunity to set the mito-ai:beta-mode-enabled command if beta mode is enabled.
        getSetting('beta_mode').then(value => {
            if (value === 'true') {
                commands.addCommand(COMMAND_MITO_AI_BETA_MODE_ENABLED, { execute: () => { /* no-op */ } });
                commands.notifyCommandChanged('toolbar-button:convert-to-streamlit');
                commands.notifyCommandChanged('toolbar-button:toggle-include-cell-in-app');
                commands.notifyCommandChanged('toolbar-button:preview-as-streamlit');
            }
        }).catch(error => {
            console.error('Error checking beta mode:', error);
        });

        console.log("mito-ai: ToolbarButtonsPlugin activated");
    }
};

export default ToolbarButtonsPlugin;