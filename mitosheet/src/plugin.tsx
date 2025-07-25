/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { mitoJLabIcon } from './jupyter/MitoIcon';
import { getArgsFromMitosheetCallCode, getCodeString, hasCodeCellBeenEditedByUser, getLastNonEmptyLine } from './jupyter/code';
import { JupyterComm } from './jupyter/comm';
import {
    createCodeCellAtIndex,
    getCellAtIndex,
    getCellCallingMitoshetWithAnalysis,
    getCellIndexesByExecutionCount,
    getCellText,
    getMostLikelyCellIndexByExeuctionNumber,
    getMostLikelyMitosheetCallingCell,
    getParentMitoContainer,
    isEmptyCell,
    tryOverwriteAnalysisToReplayParameter,
    tryWriteAnalysisToReplayParameter,
    writeToCell,
    writeToCodeCellAtIndex,
} from './jupyter/extensionUtils';
import { MitoAPI, PublicInterfaceVersion } from './mito';
import { MITO_TOOLBAR_OPEN_SEARCH_ID, MITO_TOOLBAR_REDO_ID, MITO_TOOLBAR_UNDO_ID } from './mito/components/toolbar/Toolbar';
import { getOperatingSystem, keyboardShortcuts } from './mito/utils/keyboardShortcuts';

const registerMitosheetToolbarButtonAdder = (tracker: INotebookTracker) => {

    // Whenever there is a new notebook, we add a new button to it's toolbar
    tracker.widgetAdded.connect((_, newNotebook) => {
        const button = new ToolbarButton({
            className: 'toolbar-mito-button-class',
            icon: mitoJLabIcon,
            onClick: (): void => {
                window.commands?.execute('mitosheet:create-empty-mitosheet');
            },
            tooltip: 'Create a blank Mitosheet below the active code cell',
            label: 'New Mitosheet',
        });
        
        newNotebook.toolbar.insertAfter('cellType', 'Create Mito Button', button);
    })
}

/**
 * Activate the widget extension.
 * 
 * This gets executed when Jupyter Lab turns activates the Mito extension, which 
 * happens when the Jupyter Lab server is started. 
 */
function activateMitosheetExtension(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): void {

    console.log('Mitosheet extension activated');

    // Add the Create New Mitosheet button
    registerMitosheetToolbarButtonAdder(notebookTracker);

    /**
     * This command creates a new comm for the mitosheet to talk to the mito backend. 
     */
    app.commands.addCommand('mitosheet:create-mitosheet-comm', {
        label: 'Create Comm',
        execute: async (args: any): Promise<JupyterComm | 'no_backend_comm_registered_error' | undefined> => {

            const kernelID = args.kernelID;
            const commTargetID = args.commTargetID;


            let currentKernel = undefined;
            if (kernelID === 'kernel-00000000-0000-0000-0000-000000000000') {
                // If we get a dummy kernel ID, we are in a jupyterlite instance, so we 
                // just get the current kernel as this is our best guess as to what the
                // kernel is
                currentKernel = notebookTracker.currentWidget?.context.sessionContext.session?.kernel;
            } else {
                // If we have a kernel ID, get the kernel with the correct kernel id
                const currentNotebook = notebookTracker.find((nb) => {
                    return nb.sessionContext.session?.kernel?.id === kernelID
                });
                currentKernel = currentNotebook?.sessionContext?.session?.kernel;
            }

            

            // If there is no kernel with this ID, then we know the kernel has been restarted, and so 
            // we tell the user this
            if (currentKernel === undefined || currentKernel === null) {
                return 'no_backend_comm_registered_error';
            }
                        
            const comm = currentKernel.createComm(commTargetID);
            return (comm as unknown) as JupyterComm | undefined;
        }
    })

    app.commands.addCommand('mitosheet:write-analysis-to-replay-to-mitosheet-call', {
        label: 'Given an analysisName, writes it to the mitosheet.sheet() call that created this mitosheet, if it is not already written to this cell.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const analysisName = args.analysisName as string;
            const mitoAPI = args.mitoAPI as MitoAPI;
            const cellAndIndex = getMostLikelyMitosheetCallingCell(notebookTracker, analysisName);

            if (cellAndIndex) {
                const [cell, ] = cellAndIndex;
                const written = tryWriteAnalysisToReplayParameter(cell, analysisName);
                if (written) {
                    return;
                }
            } 

            // Log if we are unable to write this param for any reason
            void mitoAPI.log('write_analysis_to_replay_to_mitosheet_call_failed');
        }
    })

    app.commands.addCommand('mitosheet:overwrite-analysis-to-replay-to-mitosheet-call', {
        label: 'Given an oldAnalysisName and newAnalysisName, writes the newAnalysisName to the mitosheet.sheet() call that has the oldAnalysisName.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const oldAnalysisName = args.oldAnalysisName as string;
            const newAnalysisName = args.newAnalysisName as string;
            const mitoAPI = args.mitoAPI as MitoAPI;

            const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(notebookTracker, oldAnalysisName);
            if (mitosheetCallCellAndIndex === undefined) {
                return;
            }

            const [mitosheetCallCell, ] = mitosheetCallCellAndIndex;

            const overwritten = tryOverwriteAnalysisToReplayParameter(mitosheetCallCell, oldAnalysisName, newAnalysisName);
            if (!overwritten) {
                void mitoAPI.log('overwrite_analysis_to_replay_to_mitosheet_call_failed');
            }
        }
    })

    app.commands.addCommand('mitosheet:write-generated-code-cell', {
        label: 'Writes the generated code for a mito analysis to the cell below the mitosheet.sheet() call that generated this analysis. NOTE: this should only be called after the analysis_to_replay has been written in the mitosheet.sheet() call, so this cell can be found correctly.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const analysisName = args.analysisName as string;
            const codeLines = args.code as string[];
            const telemetryEnabled = args.telemetryEnabled as boolean;
            const publicInterfaceVersion = args.publicInterfaceVersion as PublicInterfaceVersion;
            const triggerUserEditedCodeDialog = args.triggerUserEditedCodeDialog as (codeWithoutUserEdits: string[], codeWithUserEdits: string[]) => void;
            const overwriteIfUserEditedCode = args.overwriteIfUserEditedCode as boolean | undefined;

            // This is the last saved analysis' code, which we use to check if the user has changed
            // the code in the cell. If they have, we don't want to overwrite their changes automatically.
            const oldCode = args.oldCode as string[];
            
            const code = getCodeString(analysisName, codeLines, telemetryEnabled, publicInterfaceVersion);
            // Find the cell that made the mitosheet.sheet call, and if it does not exist, give
            // up immediately
            const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(notebookTracker, analysisName);
            if (mitosheetCallCellAndIndex === undefined) {
                return;
            }

            const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;

            const notebook = notebookTracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (notebook === undefined || cells === undefined) {
                return;
            }

            const activeCellIndex = notebook.activeCellIndex;

            const codeCell = getCellAtIndex(cells, mitosheetCallIndex + 1);
            const codeCellText = getCellText(codeCell);


            // If the user has edited the code and they haven't chosen whether or not to overwrite the contents of the cell,
            // trigger the dialog to ask them. 
            if (overwriteIfUserEditedCode === undefined && !isEmptyCell(codeCell) && hasCodeCellBeenEditedByUser(oldCode, codeCellText)) {
                triggerUserEditedCodeDialog(oldCode, codeCellText.split('\n'));
                return;
            // Only write to the cell if either of the following are true:
            // 1. The user has authorized overwriting the cell
            // 2. The cell hasn't been edited by the user
            // AND the cell exists. If the cell doesn't exist we can't write to it!
            } else if (codeCell !== undefined && (overwriteIfUserEditedCode || !hasCodeCellBeenEditedByUser(oldCode, codeCellText))) {
                writeToCell(codeCell, code)
            } else {
                // If we cannot write to the cell below, we have to go back a new cell below, 
                // which can be a bit of an involve process
                if (mitosheetCallIndex !== activeCellIndex) {
                    // We have to move our selection back up to the cell that we 
                    // make the mitosheet call to 
                    if (mitosheetCallIndex < activeCellIndex) {
                        for (let i = 0; i < (activeCellIndex - mitosheetCallIndex); i++) {
                            NotebookActions.selectAbove(notebook);
                        }
                    } else if (mitosheetCallIndex > activeCellIndex) {
                        for (let i = 0; i < (mitosheetCallIndex - activeCellIndex); i++) {
                            NotebookActions.selectBelow(notebook);
                        }
                    }
                }
                // And then write to this new cell below, which is now the active cell
                NotebookActions.insertBelow(notebook);
                writeToCell(notebook?.activeCell?.model, code);
            }
        }
    })

    app.commands.addCommand('mitosheet:write-generated-code-cell-by-execution-count', {
        label: 'Writes the generated code for a deafult dataframe output mitosheet. Writes the code to the code cell below the specified code cell',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const analysisName = args.analysisName as string;
            const codeLines = args.code as string[];
            const telemetryEnabled = args.telemetryEnabled as boolean;
            const publicInterfaceVersion = args.publicInterfaceVersion as PublicInterfaceVersion;
            const inputCellExecutionCount = args.inputCellExecutionCount as number | undefined; 

            // This is the last saved analysis' code, which we use to check if the user has changed
            // the code in the cell. If they have, we don't want to overwrite their changes automatically.
            const oldCode = args.oldCode as string[];
            const newCode = getCodeString(analysisName, codeLines, telemetryEnabled, publicInterfaceVersion, true);
            const notebook = notebookTracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (inputCellExecutionCount === undefined || notebook === undefined || cells === undefined) {
                return;
            }

            const cellIndexes = getCellIndexesByExecutionCount(cells, inputCellExecutionCount);
            const mimeRenderInputCellIndex = getMostLikelyCellIndexByExeuctionNumber(cellIndexes, notebook.activeCellIndex);
            
            if (mimeRenderInputCellIndex === undefined) {
                // If the code cell that created the mitosheet mime render does not exist, 
                // just return. I don't think this should ever happen because you can't 
                // have a mimerender for a code cell that does not exist anymore.
                return;
            }

            const codeCell = getCellAtIndex(cells, mimeRenderInputCellIndex + 1)
            const codeCellText = getCellText(codeCell);

            if (codeCell === undefined) {
                // If there is no cell below the mitosheet, create one. 
                createCodeCellAtIndex(mimeRenderInputCellIndex + 1, notebook);
                writeToCodeCellAtIndex(mimeRenderInputCellIndex + 1, notebook, newCode);
                return;
            } else if (codeCellText === '') {
                // If the code cell is empty, then we can write to it. 
                writeToCell(codeCell, newCode)
            } else if ((oldCode === null || oldCode.length === 0) && newCode === '') {
                // If the old code is null and the new code is empty, we do nothing.
                // We don't want to create a new cell if there is nothing to write to it.
                return;
            } else if ((oldCode === null || oldCode.length === 0) || hasCodeCellBeenEditedByUser(oldCode, codeCellText)) {
                // Otherwise, if 
                // 1. its the first time we are writing code, or
                // 2. the code cell below mito is not the Mito generated code 
                // then we create a new code cell and write to it. 
                // Case 2 is occurs when: 
                // 1. The user has edited the generated code 
                // 2. There is some other code right below the mitosheet (this will be common in the mimerender case)
                createCodeCellAtIndex(mimeRenderInputCellIndex + 1, notebook);
                writeToCodeCellAtIndex(mimeRenderInputCellIndex + 1, notebook, newCode);
                return;
            } else {
                // Otherwise, we overwrite the current cell with the new code
                writeToCodeCellAtIndex(mimeRenderInputCellIndex + 1, notebook, newCode);
                return;
            }
        }
    })


    app.commands.addCommand('mitosheet:write-code-snippet-cell', {
        label: 'Writes the generated code for a mito analysis to the cell below the mitosheet.sheet() call that generated this analysis. NOTE: this should only be called after the analysis_to_replay has been written in the mitosheet.sheet() call, so this cell can be found correctly.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const analysisName = args.analysisName as string;
            const code = args.code as string;
            
            // Find the cell that made the mitosheet.sheet call, and if it does not exist, give up immediately
            const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(notebookTracker, analysisName);
            if (mitosheetCallCellAndIndex === undefined) {
                return;
            }

            const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;

            const notebook = notebookTracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (notebook === undefined || cells === undefined) {
                return;
            }

            const codeSnippetCell = getCellAtIndex(cells, mitosheetCallIndex + 2);

            if (isEmptyCell(codeSnippetCell)) {
                writeToCell(codeSnippetCell, code)
            } else {
                // Otherwise, we assume since the user is editing the mitosheet, that this
                // was called as they have the code cell selected, so we insert two below
                NotebookActions.selectBelow(notebook);
                NotebookActions.insertBelow(notebook);

                // And then write to this new cell below, which is now the active cell
                writeToCell(notebook?.activeCell?.model, code);
            }
        }
    })

    app.commands.addCommand('mitosheet:get-args', {
        label: 'Reads the arguments passed to the mitosheet.sheet call.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any): string[] => {
            const analysisToReplayName = args.analysisToReplayName as string | undefined;
            const cellAndIndex = getMostLikelyMitosheetCallingCell(notebookTracker, analysisToReplayName);
            if (cellAndIndex) {
                const [cell, ] = cellAndIndex;
                return getArgsFromMitosheetCallCode(getCellText(cell));
            } else {
                return [];
            }
        }
    });

    app.commands.addCommand('mitosheet:get-args-by-execution-count', {
        label: 'Reads the arguments on the last line of a code cell.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any): string[] => {
            const notebook = notebookTracker.currentWidget?.content;
            const cells = notebook?.model?.cells;
            const inputCellExecutionCount = args.inputCellExecutionCount as number | undefined;
            const cellIndexes = getCellIndexesByExecutionCount(cells, inputCellExecutionCount);

            if (notebook === undefined || cells === undefined || cellIndexes.length === 0) {
                return [];
            }

            const cellIndex = getMostLikelyCellIndexByExeuctionNumber(cellIndexes, notebook.activeCellIndex);

            const cell = getCellAtIndex(cells, cellIndex);
            if (cell) {
                // We assume that we're using this to parse the dataframe name at the end of a code cell
                // that created a dataframe rendermine mitosheet. If there were other variables on the last line 
                // besides the dataframe, we would not have gotten the dataframe renderer.
                let dfName = getLastNonEmptyLine(getCellText(cell));

                // If the line ends with a comment, we want to remove the comment
                if (dfName && dfName.includes('#')) {
                    dfName = dfName.split('#')[0];
                }

                // If the line ends with a .tail() or .head() we want to remove that from the dfName
                if (dfName && (dfName.endsWith('.tail()') || dfName.endsWith('.head()'))) {
                    dfName = dfName.slice(0, -7);
                }

                if (dfName === undefined) {
                    return [];
                }

                return [dfName.trim()]
            } else {
                return [];
            }
        }
    });

    app.commands.addCommand('mitosheet:create-empty-mitosheet', {
        label: 'Creates a new empty mitosheet',
        execute: async (): Promise<void> => {

            // We get the current notebook (currentWidget)
            const notebook = notebookTracker.currentWidget?.content;
            const context = notebookTracker.currentWidget?.context;
            if (!notebook || !context) return;

            // Create a new code cell that creates a blank mitosheet
            NotebookActions.insertBelow(notebook);
            const newActiveCell = notebook.activeCell;

            writeToCell(newActiveCell?.model, `import mitosheet\nmitosheet.sheet()`);

            // Execute the new code cell
            void NotebookActions.run(notebook, context.sessionContext);
        }
    });


    /**
     * Keyboard shortcuts defined below.
     * 
     * For some reason, some keyboard shortcuts can be defined in Mito.tsx and others
     * cannot be. If we try and detect Command + Z in the Mito.tsx file with an event
     * listener, it does not appear. 
     * 
     * Thus, for now, we split up our keyboard shortcut handling across multiple places.
     * We will address this in the future, when we can figure out why it is occuring!
     */
    for (const shortcut of keyboardShortcuts) {
        // Only add the keyboard shortcut if it has a jupyterLabAction defined. 
        if (shortcut.jupyterLabCommand !== undefined) {
            const operatingSystem = getOperatingSystem();
            const keyCombo = operatingSystem === 'mac' ? shortcut.macKeyCombo : shortcut.winKeyCombo

            app.commands.addKeyBinding({
                // Note: This action should be added as a command as well.
                // See app.commands.addCommand('mitosheet:open-search', ...) 
                command: shortcut.jupyterLabCommand,
                args: {},
                selector: '.mito-container',
                // TODO: if there are multiple keys or the shortcut doesn't use the "accel" key, this won't work.
                keys: ['Accel '+keyCombo.keys[0].toUpperCase()]
            });
        }
    }
    app.commands.addCommand('mitosheet:open-search', {
        label: 'Focuses on search of the currently selected mito notebook',
        execute: async (): Promise<void> => {
            // First, get the mito container that this element is a part of
            const mitoContainer = getParentMitoContainer();

            // Get the search input, and click + focus on it
            const searchButton = mitoContainer?.querySelector(`#${MITO_TOOLBAR_OPEN_SEARCH_ID}`) as HTMLInputElement | null;

            // Focusing on the searchInput so that we begin typing there
            searchButton?.click();
        }
    });

    app.commands.addCommand('mitosheet:mito-undo', {
        label: 'Clicks the undo button once',
        execute: async (): Promise<void> => {
            // First, get the mito container that this element is a part of
            const mitoContainer = getParentMitoContainer();

            // If we are in an input or text, we don't actually do the undo, as it's handled in the input
            if (document.activeElement?.tagName.toLowerCase() === 'input' || document.activeElement?.tagName.toLowerCase() === 'textarea') {
                return;
            }

            // Get the undo button, and click it
            const undoButton = mitoContainer?.querySelector(`#${MITO_TOOLBAR_UNDO_ID}`) as HTMLDivElement | null;
            undoButton?.click()
        }
    });

    app.commands.addCommand('mitosheet:mito-redo', {
        label: 'Clicks the redo button once',
        execute: async (): Promise<void> => {
            // First, get the mito container that this element is a part of
            const mitoContainer = getParentMitoContainer();

            // If we are in an input or text, we don't actually do the undo, as it's handled in the input
            if (document.activeElement?.tagName.toLowerCase() === 'input' || document.activeElement?.tagName.toLowerCase() === 'textarea') {
                return;
            }

            // Get the undo button, and click it
            const redoButton = mitoContainer?.querySelector(`#${MITO_TOOLBAR_REDO_ID}`) as HTMLDivElement | null;
            redoButton?.click()
        }
    });


    /* 
        Since Shift + Enter reruns the cell, we don't want this to happen
        when the user has Mito selected. So we supress this.

        TODO: there is a bug where maybe this is contributing to the fact
        that I cannot detect Shift + Enter in inputs within Mito.. it's really
        annoying.
    */
    app.commands.addKeyBinding({
        command: 'mitosheet:do-nothing',
        args: {},
        keys: ['Shift Enter'],
        selector: '.mito-container'
    });


    // We need to add the app.commands to the window object 
    // so we can create a new mitosheet when the user clicks the button.
    // And establish the connection from Jupyter to the Mito frontend.
    window.commands = app.commands;
}

const mitosheetJupyterLabPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mitosheet:plugin',
    requires: [INotebookTracker],
    activate: activateMitosheetExtension,
    autoStart: true,
};

export default mitosheetJupyterLabPlugin;