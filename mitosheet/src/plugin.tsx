// Copyright (c) Mito

// NOTE: we give these npm packages special names in our package.json,
// as they are different packages between jlab2 and jlab3. Thus, by switching
// only our package.json, we can change what packages we import, without 
// having to change what we import in code. This allows us to support 
// jlab2 and jlab3
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ToolbarButton } from '@jupyterlab/apputils';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { mitoJLabIcon } from './components/icons/JLabIcon/MitoIcon';
import MitoAPI from './jupyter/api';
import { LabComm } from './jupyter/comm';
import {
    getCellAtIndex, getCellCallingMitoshetWithAnalysis, getCellText, getMostLikelyMitosheetCallingCell, getParentMitoContainer, isEmptyCell, tryOverwriteAnalysisToReplayParameter, tryWriteAnalysisToReplayParameter, writeToCell
} from './jupyter/lab/extensionUtils';
import { containsGeneratedCodeOfAnalysis, getArgsFromMitosheetCallCode, getCodeString, getLastNonEmptyLine } from './utils/code';

const addButton = (tracker: INotebookTracker) => {
    /**
     * tracker.widgetAdded.connect((slot) => {
            slot.
        })

        Does this allow us to do this??? I think perhaps...
     */

    // We try and add the button every 3 seconds for 20 seconds, in case
    // the panel takes a while to load
    let buttonLoaded = false;

    for (let i = 0; i < 20; i += 3) {
        setTimeout(() => {
            if (buttonLoaded) {
                return 
            }

            const button = new ToolbarButton({
                className: 'toolbar-mito-button-class',
                icon: mitoJLabIcon,
                onClick: (): void => {
                    window.commands?.execute('mitosheet:create-empty-mitosheet');
                },
                tooltip: 'Create a blank Mitosheet below the active code cell',
                label: 'Create New Mitosheet',
            });

            const panel = tracker.currentWidget;

            if (panel && !buttonLoaded) {
                panel.toolbar.insertAfter('cellType', 'Create Mito Button', button);
                buttonLoaded = true;
            } 
        }, i * 1000)
    }
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
): void {

    // Add the Create New Mitosheet button
    addButton(tracker);

    /**
     * This command creates a new comm for the mitosheet to talk to the mito backend. 
     */
    app.commands.addCommand('mitosheet:create-mitosheet-comm', {
        label: 'Create Comm',
        execute: async (args: any): Promise<LabComm | 'no_backend_comm_registered_error' | undefined> => {
            const kernelID = args.kernelID;
            const commTargetID = args.commTargetID;

            // First, get the kernel with the correct kernel id
            const currentNotebook = tracker.find((nb) => {
                return nb.sessionContext.session?.kernel?.id === kernelID
            });
            const currentKernel = currentNotebook?.sessionContext?.session?.kernel;

            // If there is no kernel with this ID, then we know the kernel has been restarted, and so 
            // we tell the user this
            if (currentKernel === undefined || currentKernel === null) {
                return 'no_backend_comm_registered_error';
            }
                        
            const comm = currentKernel.createComm(commTargetID);
            return (comm as unknown) as LabComm | undefined;
        }


            // Moreover, on Lab, we need to make sure that we can actually get a response if we send a message. 
            // This is because we can create a comm on the frontend even if there is not backend target currently
            // registered. In other words, if you have mitosheet rendered in lab, and you refresh the page, then
            // the comm will be created and opened with nothing on the backend to receive messages. 

            // In this case, we want to have some special way of letting the init() function of the mito API know
            // that it is getting a comm that is broken because the cell has not been rerun... and simply hiding
            // the mitosheet, and displaying something different instead.

            // This would, of course, be much easier if we were creating the comm way ahead of time

            /**
             * The problem is with JupyterLab. When you save a notebook in lab that has a rendered notebook in it, 
             * the notebook will be saved with the JS output. Thus, when you reopen the notebook, this js code
             * will reexecute. So: Mito will be rendered, a new frontend object representing the comm will be 
             * recreated, and (since it's the first time Mito is being rendered) the analysis will be replayed 
             * from the start (since the backend has already replayed the analysis, this is just a noop).
             * 
             * Now, as is, this isn't a huge problem if you literally just refresh the page. The problem comes 
             * when you restart the kernel, and then refresh the page. Mito renders (again thinking it's the first
             * time it's been rendered), and tries to create a comm. But since no comm has been registered on the 
             * backend already, no messages can be received by the backend, or send from the backend. So the 
             * frontend thinks a comm is created (as Jupyter will happily create a frontend comm even if it doesn't
             * hook up anywhere). 
             * 
             * Thus, we need a way of detecting three distinct cases:
             * 1.   No comm can be created by the frontend (the install is broken, the extension that creates the comm isn't working)
             * 2.   A comm can be created, but it has no connection to the backend, becuase the JS has run but the mitosheet.sheet call
             *      has not been run (the case described in the paragraph above)
             * 3.   The comm has been created and connects successfully to the backend. 
             * 
             * This third case is the one case where we actually have a working mitosheet. In this case, we can 
             * proceded with things going well.
             * 
             * There is additional complexity, due to _when_ the JS that renders the mitosheet actually runs. Specifically,
             * the JS that renders the mitosheet runs _before_ the window.commands have been set / the extension has been
             * setup. So we need take special care to wait around, when we're trying to make the comms, and try and make it
             * for a few seconds.
             * 
             * I do not think widgets reappear if you restart the kernel and refresh the page. I think it's literally
             * for this exact reason. Which is pretty cool. I don't know how they do it -- but probably the widget manager
             * just doesn't run again until the cell that generates the widget output is literally rerun.
             * 
             * Here's my proposed solution:
             * 1.   We refactor the Mito component to have the useMitoAPI hook to return:
             *      MitoAPIContainer: {mitoAPI: MitoAPI, creationError: undefined} | {mitoAPI: undefined, creationError: 'no_extension' | 'no_backend_comm_registered'}
             * 2.   After all the hooks we call in Mito (as we cannot call hooks conditionally), we case to see if the API is defined
             * 3.   If it is defined, we move forward as normal. If not, we case on the error, and display an NoBackendConnection component. 
             * 4.   The NoBackendConnection is not a mitosheet, it's just a simple error message, that tells a user how to resolve their
             *      issue.
             * 
             * The details of the useMitoAPI hook:
             * 1.   It has 3 pieces of state: the mitoAPI (or undefined), the error (or undefined), and ifFinished, which is a boolean
             *      that tracks if we're given up on creating the comm.
             * 2.   It creates the MitoAPI sync with no comm. 
             * 3.   Then, it tries to create the comm. 
             *          -   If it creates it, it sends a message to the backend and tries to get a echo response -- we should
             *              be able to do this with the echo code.
             *              -  If an echo response is received within the timeout, then set isFinished to true, and call init with this
             *              - If an evho is not recepived by the timeout, then set isFinished to true, and error to 'no_backend_comm_registered'
             * 4.   If it cannot create the comm, then it isFinished to true, and sets the error to 'no_extension'
             * 
             * The code in Mito.tsx that sends messages before the API is created, we handle just by add a dependency of mitoAPI to the effect,
             * and only running that code if it is defined! That way, it will just run once when the API is finially set... becuase it should
             * never be switched out in the middle!
             */
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

            const code = getCodeString(analysisName, codeLines, telemetryEnabled);
            
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

            if (isEmptyCell(codeCell) || containsGeneratedCodeOfAnalysis(getCellText(codeCell), analysisName)) {
                writeToCell(codeCell, code)
            } else {
                // If we cannot write to the cell below, we have to go back a new cell below, 
                // which can eb a bit of an involve process
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
            const activeCell = notebook.activeCell?.model;
            let dataframeVariableName = getLastNonEmptyLine(getCellText(activeCell))

            // If the dataframeVariableName has a .head at the end of it, we strip this,
            // and display the entire dataframe
            if (dataframeVariableName?.endsWith('.head()')) {
                dataframeVariableName = dataframeVariableName.split('.head()')[0];
            }
            
            // Clear the output of the active cell
            NotebookActions.clearOutputs(notebook)

            // Create a new code cell that creates a blank mitosheet
            NotebookActions.insertBelow(notebook);
            const newActiveCell = notebook.activeCell;

            writeToCell(newActiveCell?.model, `import mitosheet\nmitosheet.sheet(${dataframeVariableName})`);

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

    /* 
        To make Command + F focus on search, we add these commands as a key-binding
        that specifically is captured inside the mito-container.

        If Command + F is pressed in this context, we go and get the search input, and
        focus on it, so the user can just starting typing in it!
    */
    app.commands.addKeyBinding({
        command: 'mitosheet:focus-on-search',
        args: {},
        keys: ['Accel F'],
        selector: '.mito-container'
    });
    app.commands.addCommand('mitosheet:focus-on-search', {
        label: 'Focuses on search of the currently selected mito notebook',
        execute: async (): Promise<void> => {
            // First, get the mito container that this element is a part of
            const mitoContainer = getParentMitoContainer();

            // Get the search input, and click + focus on it
            const searchInput = mitoContainer?.querySelector('#action-search-bar-id') as HTMLInputElement | null;

            // Focusing on the searchInput so that we begin typing there
            searchInput?.focus();
        }
    });

    app.commands.addKeyBinding({
        command: 'mitosheet:mito-undo',
        args: {},
        keys: ['Accel Z'],
        selector: '.mito-container'
    });
    app.commands.addCommand('mitosheet:mito-undo', {
        label: 'Clicks the undo button once',
        execute: async (): Promise<void> => {
            // First, get the mito container that this element is a part of
            const mitoContainer = getParentMitoContainer();

            // Get the undo button, and click it
            const undoButton = mitoContainer?.querySelector('#mito-undo-button') as HTMLDivElement | null;
            undoButton?.click()
        }
    });

    app.commands.addKeyBinding({
        command: 'mitosheet:mito-redo',
        args: {},
        keys: ['Accel Y'],
        selector: '.mito-container'
    });
    app.commands.addCommand('mitosheet:mito-redo', {
        label: 'Clicks the redo button once',
        execute: async (): Promise<void> => {
            // First, get the mito container that this element is a part of
            const mitoContainer = getParentMitoContainer();

            // Get the undo button, and click it
            const redoButton = mitoContainer?.querySelector('#mito-redo-button') as HTMLDivElement | null;
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

    window.commands = app.commands; // So we can write to it elsewhere
}

const mitosheetJupyterLabPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mitosheet:plugin',
    requires: [INotebookTracker],
    activate: activateMitosheetExtension,
    autoStart: true,
};

export default mitosheetJupyterLabPlugin;