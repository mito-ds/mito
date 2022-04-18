// Copyright (c) Mito

// NOTE: we give these npm packages special names in our package.json,
// as they are different packages between jlab2 and jlab3. Thus, by switching
// only our package.json, we can change what packages we import, without 
// having to change what we import in code. This allows us to support 
// jlab2 and jlab3
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { Application, IPlugin } from 'application';
import { Widget } from 'widgets';
import MitoAPI from './jupyter/api';
import { containsGeneratedCodeOfAnalysis, containsMitosheetCallWithAnyAnalysisToReplay, getArgsFromMitosheetCallCell, getCellAtIndex, getCellCallingMitoshetWithAnalysis, getCellText, getLastNonEmptyLine, getMostLikelyMitosheetCallingCell, getParentMitoContainer, isEmptyCell, isMitosheetCallCell, tryOverwriteAnalysisToReplayParameter, tryWriteAnalysisToReplayParameter, writeToCell } from './jupyter/lab/pluginUtils';
import { getAnalysisNameFromOldGeneratedCode, getCodeString } from './utils/code';
import { MODULE_NAME, MODULE_VERSION } from './version';
import * as widgetExports from './jupyter/widget';


const EXTENSION_ID = 'mitosheet:plugin';

/**
 * The example plugin.
 */
const mitosheetJupyterLabPlugin: IPlugin<Application<Widget>, void> = ({
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry, INotebookTracker],
    activate: activateWidgetExtension,
    autoStart: true,
} as unknown) as IPlugin<Application<Widget>, void>;
// The "as unknown as ..." typecast above is solely to support JupyterLab 1
// and 2 in the same codebase and should be removed when we migrate to Lumino.

export default mitosheetJupyterLabPlugin;

/**
 * Activate the widget extension.
 * 
 * This gets executed when Jupyter Lab turns activates the Mito extension, which 
 * happens when the Jupyter Lab server is started. 
 */
function activateWidgetExtension(
    app: Application<Widget>,
    registry: IJupyterWidgetRegistry,
    tracker: INotebookTracker
): void {

    app.commands.addCommand('write-analysis-to-replay-to-mitosheet-call', {
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

    app.commands.addCommand('overwrite-analysis-to-replay-to-mitosheet-call', {
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


    app.commands.addCommand('move-saved-analysis-id-to-mitosheet-call', {
        label: 'Reads an old existing mito analysis from the generated code cell, and moves it to the mitosheet.sheet call above, to upgrade to the new format.',
        execute: async (): Promise<boolean> => {

            /**
             * This is one of the few places of this code that we still rely on the active cell, and 
             * as such we need to call this function right after the sheet renders for the first
             * time, so the active cell is most likely in the correct location.
             */

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (!notebook || !cells) {
                return false;
            }

            // We get the previous cell to the current active cell
            const activeCell = notebook.activeCell?.model;
            const activeCellIndex = notebook.activeCellIndex;

            if (!activeCell)  {
                return false;
            }

            const activeCellCode = getCellText(activeCell);
            const oldAnalysisName = getAnalysisNameFromOldGeneratedCode(activeCellCode);

            if (oldAnalysisName === undefined)  {
                return false;
            }

            // If there is an analysis name in the generated code with the old format, 
            // we go to the previous cell (which should be a mitosheet.sheet call), and
            // add it as a parameter to this call, and then rerun this top cell. This allows
            // us to remove a large amount of legacy code with how we used to replay analyses
            const previousCell = getCellAtIndex(cells, activeCellIndex - 1)

            if (!isMitosheetCallCell(previousCell)) {
                return false;
            }

            // If it already has a saved analysis (though this should never happen), return
            if (containsMitosheetCallWithAnyAnalysisToReplay(previousCell)) {
                return false;
            }

            // Otherwise, add this parameter to the mitosheet call!
            const written = tryWriteAnalysisToReplayParameter(previousCell, oldAnalysisName);
            if (!written) {
                return false;
            }

            // And then move up to the mitosheet.sheet() call and rerun this!
            NotebookActions.selectAbove(notebook);

            const sessionContext = tracker.currentWidget?.context?.sessionContext;
            await NotebookActions.runAndAdvance(notebook, sessionContext);

            // Return true if we actually added this analysis to replay to the top cell
            return true;
        }
    });

    app.commands.addCommand('write-generated-code-cell', {
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

            if (isEmptyCell(codeCell) || containsGeneratedCodeOfAnalysis(codeCell, analysisName)) {
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

    app.commands.addCommand('get-args', {
        label: 'Reads the arguments passed to the mitosheet.sheet call.',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any): string[] => {
            const analysisToReplayName = args.analysisToReplayName as string | undefined;
            const cellAndIndex = getMostLikelyMitosheetCallingCell(tracker, analysisToReplayName);
            if (cellAndIndex) {
                const [cell, ] = cellAndIndex;
                return getArgsFromMitosheetCallCell(cell);
            } else {
                return [];
            }
        }
    });

    app.commands.addCommand('create-mitosheet-from-dataframe-output', {
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
            const activeCell = notebook.activeCell;
            let dataframeVariableName = getLastNonEmptyLine(activeCell?.model)

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

    /* 
        To make Command + F focus on search, we add these commands as a key-binding
        that specifically is captured inside the mito-container.

        If Command + F is pressed in this context, we go and get the search input, and
        focus on it, so the user can just starting typing in it!
    */
    app.commands.addKeyBinding({
        command: 'focus-on-search',
        args: {},
        keys: ['Accel F'],
        selector: '.mito-container'
    });
    app.commands.addCommand('focus-on-search', {
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
        command: 'mito-undo',
        args: {},
        keys: ['Accel Z'],
        selector: '.mito-container'
    });
    app.commands.addCommand('mito-undo', {
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
        command: 'mito-redo',
        args: {},
        keys: ['Accel Y'],
        selector: '.mito-container'
    });
    app.commands.addCommand('mito-redo', {
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
        command: 'do-nothing',
        args: {},
        keys: ['Shift Enter'],
        selector: '.mito-container'
    });
    app.commands.addCommand('do-nothing', {
        label: 'Does nothing',
        execute: async (): Promise<void> => {
            // Do nothing, doh
        }
    });

    

    window.commands = app.commands; // So we can write to it elsewhere
    registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: widgetExports,
    });
}
