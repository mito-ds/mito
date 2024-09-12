// Copyright (c) Mito

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { mitoJLabIcon } from './jupyter/MitoIcon';
import { getArgsFromMitosheetCallCode, getCodeString, getLastNonEmptyLine, hasCodeCellBeenEditedByUser } from './jupyter/code';
import { JupyterComm } from './jupyter/comm';
import {
    getCellAtIndex, getCellCallingMitoshetWithAnalysis, getCellText, getMostLikelyMitosheetCallingCell, getParentMitoContainer, isEmptyCell, tryOverwriteAnalysisToReplayParameter, tryWriteAnalysisToReplayParameter, writeToCell
} from './jupyter/extensionUtils';
import { MitoAPI, PublicInterfaceVersion } from './mito';
import { MITO_TOOLBAR_OPEN_SEARCH_ID, MITO_TOOLBAR_REDO_ID, MITO_TOOLBAR_UNDO_ID } from './mito/components/toolbar/Toolbar';
import { getOperatingSystem, keyboardShortcuts } from './mito/utils/keyboardShortcuts';
import { IRenderMimeRegistry} from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import  DataFrameMimeRenderer from './DataFrameMimeRenderer';

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
    tracker: INotebookTracker,
    rendermime: IRenderMimeRegistry,
): void {

    console.log('Mitosheet extension activated');

    // Add the Create New Mitosheet button
    registerMitosheetToolbarButtonAdder(tracker);

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
                currentKernel = tracker.currentWidget?.context.sessionContext.session?.kernel;
            } else {
                // If we have a kernel ID, get the kernel with the correct kernel id
                const currentNotebook = tracker.find((nb) => {
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
            const cellAndIndex = getMostLikelyMitosheetCallingCell(tracker, analysisName);

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

            const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(tracker, oldAnalysisName);
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
            const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(tracker, analysisName);
            if (mitosheetCallCellAndIndex === undefined) {
                return;
            }

            const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;

            const notebook = tracker.currentWidget?.content;
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

    app.commands.addCommand('mitosheet:write-generated-code-cell-by-id', {
        label: 'Writes the generated code for a deafult dataframe output mitosheet. Writes the code to the code cell below the specified code cell',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const analysisName = args.analysisName as string;
            const codeLines = args.code as string[];
            const telemetryEnabled = args.telemetryEnabled as boolean;
            const publicInterfaceVersion = args.publicInterfaceVersion as PublicInterfaceVersion;
            const cellID = args.cellID as string | undefined; 

            // This is the last saved analysis' code, which we use to check if the user has changed
            // the code in the cell. If they have, we don't want to overwrite their changes automatically.
            const oldCode = args.oldCode as string[];
            const code = getCodeString(analysisName, codeLines, telemetryEnabled, publicInterfaceVersion);
            const notebook = tracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (cellID === undefined || notebook === undefined || cells === undefined) {
                console.log("NO NOTEBOOK OR CELLS")
                return;
            }

            const mimeRenderInputCellIndex = cells ? Array.from(cells).findIndex(cell => cell.id === cellID) : -1;
            console.log("CELLS")
            console.log(cells)
            console.log(cellID)
            console.log(mimeRenderInputCellIndex)
            if (mimeRenderInputCellIndex === -1) {
                console.log("NO MIME RENDER INPUT CELL INDEX")
                // If the code cell that created the mitosheet mime render does not exist, 
                // just return. I don't think this should ever happen because you can't 
                // have a mimerender for a code cell that does not exist anymore.
                return;
            }

            const codeCell = getCellAtIndex(cells, mimeRenderInputCellIndex + 1)

            // If there is no cell below the mitosheet, create one. 
            if (codeCell === undefined) {
                console.log("NO CODE CELL")
                // Move the active cell to the mimeRenderInputCellIndex
                notebook.activeCellIndex = mimeRenderInputCellIndex;

                // Then insert a code cell below it 
                NotebookActions.insertBelow(notebook);
            }


            // If the code cell is not the old code, then create a new code cell below the mitosheet to write to. 
            // This could occur in three cases:
            // 1. We haven't yet written code from this mitosheet and there is a code cell below the mitosheet already
            // 2. The user has edited the generated code below the mitosheet. 
            const codeCellText = getCellText(codeCell);
            if (hasCodeCellBeenEditedByUser(oldCode, codeCellText)) {
                console.log("CODE CELL HAS BEEN EDITED BY USER")
                // Move the active cell to the mimeRenderInputCellIndex
                notebook.activeCellIndex = mimeRenderInputCellIndex;

                // Then insert a code cell below it 
                NotebookActions.insertBelow(notebook);
            }


            // Then finally write the code to the code cell
            if (codeCell !== undefined) {
                console.log("WRITING CODE TO CODE CELL")
                writeToCell(codeCell, code)
                return;
            }

            console.log("CODE CELL IS UNDEFINED")
        }
    })


    app.commands.addCommand('mitosheet:write-code-snippet-cell', {
        label: 'Writes the generated code for a mito analysis to the cell below the mitosheet.sheet() call that generated this analysis. NOTE: this should only be called after the analysis_to_replay has been written in the mitosheet.sheet() call, so this cell can be found correctly.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            const analysisName = args.analysisName as string;
            const code = args.code as string;
            
            // Find the cell that made the mitosheet.sheet call, and if it does not exist, give up immediately
            const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(tracker, analysisName);
            if (mitosheetCallCellAndIndex === undefined) {
                return;
            }

            const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;

            const notebook = tracker.currentWidget?.content;
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
            const cellAndIndex = getMostLikelyMitosheetCallingCell(tracker, analysisToReplayName);
            if (cellAndIndex) {
                const [cell, ] = cellAndIndex;
                return getArgsFromMitosheetCallCode(getCellText(cell));
            } else {
                return [];
            }
        }
    });

    app.commands.addCommand('mitosheet:create-mitosheet-from-dataframe-output', {
        label: 'creates a new mitosheet from the dataframe that is printed',
        execute: async (): Promise<void> => {

            console.log("creating mitosheet from dataframe ouput")

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;
            const context = tracker.currentWidget?.context;
            if (!notebook || !context) return;

            /* 
                In order for this function to be called, it must be that the last line of 
                the active cell is a dataframe. So we just parse the active cell's text
                in order to get the dataframe name.

                Note: clicking the button in the output to call this function first makes
                the cell active, then calls this function. 
            */


            const cells = notebook?.model?.cells;
            const activeCellIndex = notebook.activeCellIndex
            const previousCell = getCellAtIndex(cells, activeCellIndex - 1)

            console.log("previous cell ")
            let dataframeVariableName = getLastNonEmptyLine(getCellText(previousCell))

            // If the dataframeVariableName has a .head at the end of it, we strip this,
            // and display the entire dataframe
            if (dataframeVariableName?.endsWith('.head()')) {
                dataframeVariableName = dataframeVariableName.split('.head()')[0];
            }

            console.log('here')
            console.log(previousCell)

            if (previousCell !== undefined) {
                const newCode = previousCell.sharedModel.source + `\nmitosheet.sheet(${dataframeVariableName})`
                previousCell.sharedModel.source = newCode
            }
            
            // Execute the new code cell
            void NotebookActions.run(notebook, context.sessionContext);
        }
    });

    app.commands.addCommand('mitosheet:create-empty-mitosheet', {
        label: 'Creates a new empty mitosheet',
        execute: async (): Promise<void> => {

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;
            const context = tracker.currentWidget?.context;
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
    app.commands.addCommand('mitosheet:do-nothing', {
        label: 'Does nothing',
        execute: async (): Promise<void> => {
            // Do nothing, doh
        }
    });

    // Add a custom renderer for the stderr output

    const dataframeMimeType = 'text/html'
    const factory = rendermime.getFactory(dataframeMimeType);

    if (factory) {
        rendermime.addFactory({
            safe: true,
            mimeTypes: [dataframeMimeType],  // Include both MIME types as needed
            createRenderer: (options: IRenderMime.IRendererOptions) => {
                tracker
                return new DataFrameMimeRenderer(app, options, tracker); // Pass dataframe to your renderer
            }
    }, -1);  // Giving this renderer a lower rank than the default renderer gives this default priority
}

    window.commands = app.commands; // So we can write to it elsewhere
}

const mitosheetJupyterLabPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mitosheet:plugin-new',
    requires: [INotebookTracker, IRenderMimeRegistry],
    activate: activateMitosheetExtension,
    autoStart: true,
};

export default mitosheetJupyterLabPlugin;