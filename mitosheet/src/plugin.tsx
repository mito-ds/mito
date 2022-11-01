// Copyright (c) Mito

// NOTE: we give these npm packages special names in our package.json,
// as they are different packages between jlab2 and jlab3. Thus, by switching
// only our package.json, we can change what packages we import, without 
// having to change what we import in code. This allows us to support 
// jlab2 and jlab3
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { Application, IPlugin } from 'application';
import { Widget } from "@lumino/widgets";
import MitoAPI from './jupyter/api';
import { getCellAtIndex, getCellCallingMitoshetWithAnalysis, getCellText, getCellWithCodeForAnalysis, getMostLikelyMitosheetCallingCell, getParentMitoContainer, isEmptyCell, tryOverwriteAnalysisToReplayParameter, tryWriteAnalysisToReplayParameter, writeToCell } from './jupyter/lab/pluginUtils';
import { containsGeneratedCodeOfAnalysis, getArgsFromMitosheetCallCode, getCodeString, getLastNonEmptyLine } from './utils/code';
import { MODULE_NAME, MODULE_VERSION } from './version';
import * as widgetExports from './jupyter/widget';
import { mitoJLabIcon } from './components/icons/JLabIcon/MitoIcon';

import {
    ToolbarButton,
} from '@jupyterlab/apputils';


const EXTENSION_ID = 'mitosheet:plugin';

const addButton = (tracker: INotebookTracker) => {

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
                    window.commands?.execute('create-empty-mitosheet');
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

    // Add the Create New Mitosheet button
    addButton(tracker);


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

            let writtenToCell = codeCell;
            
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
                writtenToCell = notebook?.activeCell?.model;
            }

            // Finially, we make this cell read only
            if (writtenToCell !== undefined) {
                if (!isEmptyCell(writtenToCell)) {
                    writtenToCell.metadata.set('editable', false);
                } else {
                    writtenToCell.metadata.set('editable', true);
                }
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
                return getArgsFromMitosheetCallCode(getCellText(cell));
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

    app.commands.addCommand('create-empty-mitosheet', {
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

    app.commands.addCommand('set-generated-code-cell-metadata', {
        label: 'Set Metadata',
        execute: (args: any) => {
            const key = args.key as string;
            const value = args.value as string;
            const analysisName = args.analysisName as string;

            const codeCellData = getCellWithCodeForAnalysis(tracker, analysisName);
            const objectCurrentMetadata = (codeCellData?.metadata.get('mitosheet') as Record<string, string> | undefined) || {};
            codeCellData?.metadata.set('mitosheet', {...objectCurrentMetadata, [key]: value});
        }
    })

    app.commands.addCommand('get-generated-code-cell-metadata', {
        label: 'Get Metadata',
        execute: (args: any): string | undefined => {
            const key = args.key as string;
            const analysisName = args.analysisName as string;

            const codeCellData = getCellWithCodeForAnalysis(tracker, analysisName);
            const currentMetadata = codeCellData?.metadata.get('mitosheet') as Record<string, string>;
            return currentMetadata ? currentMetadata[key] : undefined;
        }
    })


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
