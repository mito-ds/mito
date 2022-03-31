// Copyright (c) Mito

// NOTE: we give these npm packages special names in our package.json,
// as they are different packages between jlab2 and jlab3. Thus, by switching
// only our package.json, we can change what packages we import, without 
// having to change what we import in code. This allows us to support 
// jlab2 and jlab3
import { Application, IPlugin } from 'application';
import { Widget } from 'widgets';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import {INotebookTracker, NotebookActions} from '@jupyterlab/notebook';
import {ICellModel} from "@jupyterlab/cells";

import * as widgetExports from './widget';

import { MODULE_NAME, MODULE_VERSION } from './version';

import {
    IObservableString,
    IObservableUndoableList
} from '@jupyterlab/observables';

const EXTENSION_ID = 'mitosheet:plugin';

/**
 * The example plugin.
 */
const examplePlugin: IPlugin<Application<Widget>, void> = ({
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry, INotebookTracker],
    activate: activateWidgetExtension,
    autoStart: true,
} as unknown) as IPlugin<Application<Widget>, void>;
// The "as unknown as ..." typecast above is solely to support JupyterLab 1
// and 2 in the same codebase and should be removed when we migrate to Lumino.

export default examplePlugin;


function getCellAtIndex(cells: IObservableUndoableList<ICellModel> | undefined, index: number): ICellModel | undefined {
    if (cells == undefined) {
        return undefined;
    }

    const cellsIterator = cells.iter();
    let cell = cellsIterator.next();
    let i = 0;
    while (cell) {
        if (i == index) {
            return cell;
        }

        i++;
        cell = cellsIterator.next();
    }

  
    return undefined;
}

function codeContainer(
    analysisName: string,
    code: string[],
    telemetryEnabled: boolean
): string {

    if (code.length == 0) {
        return '';
    }

    let finalCode = '';

    // When joining code, we do not add blank line between comments
    // and steps they describe, but we do add blank lines between 
    // steps. A comment describes a step if it is a single line in the
    // code array, with no new lines included in it
    const isCommentLine = (codeLine: string): boolean => {
        return codeLine.startsWith('#') && codeLine.indexOf('\n') === -1;
    }

    if (code.length > 0) {
        for (let i = 0; i < code.length; i++) {
            if (isCommentLine(code[i])) {
                finalCode += '\n'
            }
            finalCode += code[i] + '\n';
        }
    }

    // If telemetry not enabled, we want to be clear about this by
    // simply not calling a func w/ the analysis name
    if (telemetryEnabled) {
        return `from mitosheet import *; register_analysis("${analysisName}");
    ${finalCode}`
    } else {
        return `from mitosheet import *; # Analysis Name:${analysisName};
    ${finalCode}`
    }

}

function getParentMitoContainer(): Element | null {
    // First, get the mito container that this element is a part of
    let currentElement = document.activeElement;
    while (currentElement !== null) {
        if (currentElement.classList.contains('mito-container')) {
            break;
        }
        currentElement = currentElement.parentElement;
    }

    return currentElement;
}


/*
    Given the code container format, returns the name of the analysis. Handles 
    two cases of save analysis names (as we changed formats). 

    Format 1: 
    # MITO CODE START (DO NOT EDIT)
    # SAVED-ANALYSIS-START${analysisName}SAVED-ANALYSIS-END

    Format 2:
    MITO CODE START (DO NOT EDIT)

    from mitosheet import * # Import necessary functions from Mito
    register_analysis('${analysisName}') # Let Mito know which analysis is being run

    Format 3:
    from mitosheet import *; register_analysis('${analysisName}')
    
    Format 4 (when telemetry is turned off):
    from mitosheet import *; # Analysis:${analysisName}

    NOTE: after Format 4, we moved from storing the analysis name just in the generated
    code to storing it in the mitosheet.sheet call as well. This means we no longer need
    to get the analysis name from a generated codeblock, EXCEPT for the fact that we need
    to upgrade all the old code blocks to the new system. Thus, to keep track of this, we 
    add two new formats, and make these formats return early without reading in the analysis
    name. 

    The net result: after we read in the analysis once, and replay it once, we never have
    to read in the generated code cell again to try to figure out the analysis name. 

    Format 5:
    from mitosheet import *; register_analysis("${analysisName}"); 
    Format 6 (when telemetry is turned off):
    from mitosheet import *; # Analysis Name:${analysisName};

    Note that format 5 is different than Format 3 because of the types of quotes it uses

*/
function getAnalysisNameFromOldGeneratedCode(codeblock: string): string | undefined {
    if (codeblock.includes('register_analysis("') || codeblock.includes("Analysis Name:")) {
        // Return nothing for formats 5 and 6
        return;
    }

    if (codeblock.includes('SAVED-ANALYSIS-START')) {
        // Format 1
        return codeblock.substring(
            codeblock.indexOf('SAVED-ANALYSIS-START') + 'SAVED-ANALYSIS-START'.length,
            codeblock.indexOf('SAVED-ANALYSIS-END')
        );
    } else if (codeblock.includes('register_analysis') && codeblock.includes('# Let Mito know')) {
        // Format 2
        return codeblock.substring(
            codeblock.indexOf('register_analysis(\'') + 'register_analysis(\''.length,
            codeblock.indexOf('# Let Mito know') - 3
        );
    } else if (codeblock.includes('register_analysis')) {
        // Format 3
        return codeblock.substring(
            codeblock.indexOf('register_analysis(\'') + 'register_analysis(\''.length,
            codeblock.indexOf('\n') - 2
        );
    } else if (codeblock.includes('# Analysis:')) {
        // Format 4:
        return codeblock.substring(
            codeblock.indexOf('Analysis:') + 'Analysis:'.length,
            codeblock.indexOf('\n')
        );

    } else {
        // Otherwise, there is no saved analysis in this cell
        return undefined;
    }    
}

function getCellText(cell: ICellModel| undefined): string {
    if (cell == undefined) return ''; 
    const value = cell.modelDB.get('value') as IObservableString;
    return value.text;
}

function isMitosheetSheetCell(cell: ICellModel | undefined): boolean {
    // Returns true iff a the given cell ends with a mitosheet.sheet call
    // and so displays a mito sheet when run!

    const currentCode = getCellText(cell);

    // Take all the non-empty lines from the cell
    const lines = currentCode.split('\n').filter(line => {return line.length > 0});
    if (lines.length == 0) {
        return false;
    }

    const lastLine = lines[lines.length - 1];
    /* 
        We check if the last line contains a mitosheet.sheet call, which can happen in a few ways
        
        1. `import mitosheet` -> mitosheet.sheet()
        2. `import mitosheet as {THING}` -> {THING}.sheet(
        3. `from mitosheet import sheet` -> sheet(

        We detect all three by checking if the line contains `sheet(`!
    */

    return lastLine.indexOf('sheet(') !== -1;
}

function isMitoAnalysisCell(cell: ICellModel | undefined): boolean {
    // Returns true iff a the given cell is a cell containing the generated
    // mito analysis code
    const currentCode = getCellText(cell);
    // Handle the old and new Mito boilerplate code
    return currentCode.startsWith('# MITO CODE START') 
        || currentCode.startsWith('from mitosheet import *; register_analysis(')
        || currentCode.startsWith('from mitosheet import *; # Analysis:')
}

/* 
    Returns True if the passed cell is empty.
    Returns False if the passed cells is either not empty or undefined 
*/
function isEmptyCell(cell: ICellModel | undefined): boolean {
    if (cell === undefined) {
        return false
    }
    const currentCode = getCellText(cell);
    return currentCode.trim() === '';
}

function writeToCell(cell: ICellModel | undefined, code: string): void {
    if (cell == undefined) {
        return;
    }
    const value = cell.modelDB.get('value') as IObservableString;
    value.text = code;
}

function getLastNonEmptyLine(cell: ICellModel | undefined): string | undefined {
    if (cell === undefined) {
        return undefined
    }
    const activeCellText = getCellText(cell)
    const filteredActiveText = activeCellText.split(/\r?\n/).filter(line => line.trim().length > 0)
    return filteredActiveText.length > 0 ? filteredActiveText.pop() : undefined
}

/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
function containsMitosheetCallWithSpecificAnalysisToReplay(cell: ICellModel | undefined, analysisName: string): boolean {
    const currentCode = getCellText(cell);
    return currentCode.includes('sheet(') && currentCode.includes(`analysis_to_replay="${analysisName}"`)
}

/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
function containsMitosheetCallWithAnyAnalysisToReplay(cell: ICellModel | undefined): boolean {
    const currentCode = getCellText(cell);
    console.log("CHECKING FOR ANY ANALYSIS", currentCode, currentCode.includes(`analysis_to_replay=`))
    return isMitosheetSheetCell(cell) && currentCode.includes(`analysis_to_replay=`)
}

/* 
    Returns true if the cell contains the code generated for a specific analysis name
*/
function containsGeneratedCodeOfAnalysis(cell: ICellModel | undefined, analysisName: string): boolean {
    const currentCode = getCellText(cell);
    return isMitoAnalysisCell(cell) && currentCode.includes(analysisName);
}



/**
 * Returns the cell that has the mitosheet.sheet(analysis_to_replay={analysisName}) in it,
 * or undefined if no such cell exists
 */
function getCellCallingMitoshetWithAnalysis(tracker: INotebookTracker, analysisName: string): [ICellModel, number] | undefined  {
    const notebook = tracker.currentWidget?.content;
    const cells = notebook?.model?.cells;

    if (cells === undefined) {
        return undefined;
    }

    const cellsIterator = cells.iter();
    let cell = cellsIterator.next();
    let cellIndex = 0;
    while (cell) {
        if (containsMitosheetCallWithSpecificAnalysisToReplay(cell, analysisName)) {
            return [cell, cellIndex];
        }

        cellIndex++;
        cell = cellsIterator.next();
    }

    return undefined;
}

/**
 * Given a cell, will check if it has a mitosheet.sheet() call with no
 * analysis_to_replay, and if so add the analysisName as a parameter to
 * this cell. It will return true in this case. 
 * 
 * Otherwise, if this is not a mitosheet.sheet() call, or if it already has
 * a analysis_to_replay parameter, this will return false.
 */
function tryWriteAnalysisToReplayParameter(cell: ICellModel | undefined, analysisName: string): boolean {
    if (!containsMitosheetCallWithAnyAnalysisToReplay(cell)) {
        const currentCode = getCellText(cell);

        console.log(currentCode);

        // We know the mitosheet.sheet() call is the last thing in the cell, so we 
        // just replace the last closing paren
        const lastIndex = currentCode.lastIndexOf(')');
        let replacement = ``;
        if (currentCode.includes('sheet()')) {
            replacement = `analysis_to_replay="${analysisName}")`;
        } else {
            replacement = `, analysis_to_replay="${analysisName}")`;
        }
        const newCode = currentCode.substring(0, lastIndex) + replacement + currentCode.substring(lastIndex + 1);
        writeToCell(cell, newCode);
        return true;
    } 

    return false;
}

/**
 * Uses the current active cell location to write the analysis_to_replay to a mitosheet.sheet()
 * call. Note that this should only be called if there is no such mitosheet.sheet call replaying
 * this analysis already.
 */
function writeAnalysisToReplayToMitosheetCall(tracker: INotebookTracker, analysisName: string): [ICellModel, number] | undefined {
    // We get the current notebook (currentWidget)
    const notebook = tracker.currentWidget?.content;
    const cells = notebook?.model?.cells;

    if (notebook == undefined || cells == undefined) {
        return;
    }

    const activeCell = notebook.activeCell;
    const activeCellIndex = notebook.activeCellIndex;

    const previousCell = getCellAtIndex(cells, activeCellIndex - 1)

    // As the most common way for a user to run a cell for the first time is to run and advanced, this 
    // means that the active cell will most likely be one below the mitosheet.sheet() call we want to 
    // write to, so we check this first
    if (tryWriteAnalysisToReplayParameter(previousCell, analysisName)) {
        return previousCell ? [previousCell, activeCellIndex - 1] : undefined;
    } 

    // The next case we check is if they did a run and not advance, which means that the currently
    // selected cell is the mitosheet.sheet call
    if (tryWriteAnalysisToReplayParameter(activeCell?.model, analysisName)) {
        return activeCell?.model ? [activeCell?.model, activeCellIndex] : undefined;
    }

    // The last case is that the user did some sort of run all, in which case we cross our fingers
    // that there is only one cell that does not have a mitosheet call, and go looking for it
    let index = activeCellIndex;
    while (index >= 0) {
        // TODO: this is horribly inefficient, and I feel like we should just use a forward loop, desipte
        // how it feels worse... but idk if performance matters really!
        const previousCell = getCellAtIndex(cells, index)
        if (tryWriteAnalysisToReplayParameter(previousCell, analysisName)) {
            return previousCell ? [previousCell, index] : undefined
        }
        index--;
    }

    // Otherwise, we have failed, and we just give up here, and don't write anything...
    // TODO: do we want to log an error or something? I think we should log it elsewhere
}

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
        label: 'TODO',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            console.log("write-analysis-to-replay-to-mitosheet-call")
            const analysisName = args.analysisName as string;
            
            // Look through all notebook cells to find the cell with the call to the mitosheet.sheet
            // that passes this analysis_to_replay
            let mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(tracker, analysisName);
            
            if (mitosheetCallCellAndIndex === undefined) {
                // If this cell does not exist, then we must be in the first time that this mitosheet.sheet() call
                // has been made. This is the only time that we have to use active cell location information to 
                // figure out where to write the analysis name to the correct mitosheet.sheet call
                mitosheetCallCellAndIndex = writeAnalysisToReplayToMitosheetCall(tracker, analysisName);
            }

            // If the mitosheet call cell is still not defined, we cannot recover from this error 
            // and so we log this and return
            if (mitosheetCallCellAndIndex === undefined) {
                // TODO: log this
            }
        }
    })

    app.commands.addCommand('write-generated-code-cell', {
        label: 'Write ',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            console.log("write-generated-code-cell")
            const analysisName = args.analysisName as string;
            const codeLines = args.code as string[];
            const telemetryEnabled = args.telemetryEnabled as boolean;
            const code = codeContainer(analysisName, codeLines, telemetryEnabled);
            
            // Look through all notebook cells to find the cell with the call to the mitosheet.sheet
            // that passes this analysis_to_replay
            let mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(tracker, analysisName);
            
            if (mitosheetCallCellAndIndex === undefined) {
                // If this cell does not exist, then we must be in the first time that this mitosheet.sheet() call
                // has been made. This is the only time that we have to use active cell location information to 
                // figure out where to write the analysis name to the correct mitosheet.sheet call
                mitosheetCallCellAndIndex = writeAnalysisToReplayToMitosheetCall(tracker, analysisName);
            }

            // If the mitosheet call cell is still not defined, we cannot recover from this error 
            // and so we log this and return
            if (mitosheetCallCellAndIndex === undefined) {
                // TODO: log this
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
                if (mitosheetCallIndex !== activeCellIndex) {
                    // We have to move our selection back up to the cell that we 
                    // make the mitosheet call to 
                    if (mitosheetCallIndex < activeCellIndex) {
                        for (let i = 0; i < (activeCellIndex - mitosheetCallIndex); i++) {
                            NotebookActions.selectAbove(notebook);
                        }
                    } else if (mitosheetCallIndex > activeCellIndex) {
                        for (let i = 0; i < (activeCellIndex - mitosheetCallIndex); i++) {
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
        label: 'Reads the arguments passed to the mitosheet.sheet call',
        execute: (): string[] => {
        /*
            This function has to deal with the fact that there are 3 cases
            in which we want to get the args:

            1. The first time we are rendering a mitosheet (e.g. after you run a sheet
            with a mitosheet.sheet call).
            
            In this case, the active cell is the cell _after_ the mitosheet.sheet call.

            2. When creating a mitosheet from the 'View in Mito' button that is displayed
            in the pandas dataframe output.

            In this case, we're not looking for a mitosheet.sheet call. Instead, we're looking
            for the df name that is on the last line in the cell above it. To do this, we account 
            for some lag, where the cell being run with the mitosheet call is not detected as the active cell.

            3. When you have a Mito sheet already displayed and saved in your notebook, 
            and your refresh the page. 

            In this case, the active cell is the first cell in the notebook, which
            may or may not be the cell the mitosheet.sheet call is actually made. 

            We handle these cases by detecting which case we're in based on the index
            of the currently selected cell. 

            However, in a sheet with _multiple_ mitosheet.sheet calls, if we're in
            case (2), we can't know which cell to pull from. I haven't been able to
            think of away around this. 
            
            However, since this is rare for now, we don't worry about it and just do whatever
            here for now, and hope the user will refresh the sheet if it's not working!
        */
            console.log("get-args")

            // TODO: update this function to work with the mitosheet.sheet() call

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;

            if (!notebook) return [];

            const activeCellIndex = notebook.activeCellIndex;
            const cells = notebook.model?.cells;

            const getArgsFromCellContent = (content: string): string[] => {
                let nameString = content.split('mitosheet.sheet(')[1].split(')')[0];
            
                // If there is a tutorial mode parameter passed, we ignore it
                if (nameString.includes('tutorial_mode')) {
                    nameString = nameString.split('tutorial_mode')[0].trim();
                }
            
                // If there is a (old) analysis name parameter passed, we ignore it
                if (nameString.includes('saved_analysis_name')) {
                    nameString = nameString.split('saved_analysis_name')[0].trim();
                }

                // If there is a (new) analysis name parameter passed, we ignore it
                if (nameString.includes('analysis_to_replay')) {
                    nameString = nameString.split('analysis_to_replay')[0].trim();
                }
            
                // If there is a view_df name parameter, we ignore it
                if (nameString.includes('view_df')) {
                    nameString = nameString.split('view_df')[0].trim();
                }
            
                // Get the args and trim them up
                let args = nameString.split(',').map(dfName => dfName.trim());
                
                // Remove any names that are empty. Note that some of these names
                // may be strings, which we turn into valid df_names on the backend!
                args = args.filter(dfName => {return dfName.length > 0});
            
                return args;
            }

            // See comment above. We are in case (3). 
            if (activeCellIndex === 0 && cells !== undefined) {
                // We just get the first mitosheet.sheet call we can find

                const cellsIterator = cells.iter();
                let cell = cellsIterator.next();
                while (cell) {
                    const cellContent = (cell.modelDB.get('value') as IObservableString).text;
                    if (cellContent.includes('mitosheet.sheet')) {
                        return getArgsFromCellContent(cellContent);
                    }
                    cell = cellsIterator.next();
                }
                return [];
            }
            
            // Determine if we are in case (1) or (2)
            const activeCellText = (getCellAtIndex(cells, activeCellIndex)?.modelDB.get('value') as IObservableString).text
            let cell = undefined
            if (activeCellText.includes('view_df')) {
                // We are in (2)
                cell = getCellAtIndex(cells, activeCellIndex)
            } else {
                // We are in case (1)
                cell = getCellAtIndex(cells, activeCellIndex - 1); // TODO: change this to next cell model or something
            }

            if (cell) {
                const previousCellContent = (cell.modelDB.get('value') as IObservableString).text;
                return getArgsFromCellContent(previousCellContent);
            } else {
                return [];
            }      
        }
    });

    app.commands.addCommand('move-saved-analysis-id-to-mitosheet-call', {
        label: 'Reads an old existing mito analysis from the generated code cell, and moves it to the mitosheet.sheet call above, to upgrade to the new format.',
        execute: async (): Promise<boolean> => {
            console.log("move-saved-analysis-id-to-mitosheet-call")

            /*
                This should _only_ run right after the mitosheet.sheet call is run, 
                and so the currently selected cell is the cell that actually contains the mito
                analysis.
            */

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (!notebook || !cells) {
                return false;
            };

            // We get the previous cell to the current active cell
            const activeCell = notebook.activeCell?.model;
            const activeCellIndex = notebook.activeCellIndex;

            if (!activeCell)  {
                return false;
            };

            const activeCellCode = getCellText(activeCell);
            const oldAnalysisName = getAnalysisNameFromOldGeneratedCode(activeCellCode);

            if (oldAnalysisName === undefined)  {
                return false;
            };

            // If there is an analysis name in the generated code with the old format, 
            // we go to the previous cell (which should be a mitosheet.sheet call), and
            // add it as a parameter to this call, and then rerun this top cell. This allows
            // us to remove a large amount of legacy code with how we used to replay analyses
            const previousCell = getCellAtIndex(cells, activeCellIndex - 1)

            if (!isMitosheetSheetCell(previousCell)) {
                return false;
            }
            console.log("CELL TEXT", getCellText(previousCell));

            // If it already has a saved analysis (though this should never happen), return
            const x = containsMitosheetCallWithAnyAnalysisToReplay(previousCell);
            console.log("XXXX", x)
            if (x) {
                console.log("RETURNING!")
                return false;
            }

            console.log("WRITING!", "HERE")

            // Otherwise, add this parameter to the mitosheet call!
            const written = tryWriteAnalysisToReplayParameter(previousCell, oldAnalysisName);
            if (!written) {
                return false;
            }

            // And then move up to the mitosheet.sheet() call and rerun this!
            NotebookActions.selectAbove(notebook);

            const sessionContext = tracker.currentWidget?.context?.sessionContext;
            NotebookActions.runAndAdvance(notebook, sessionContext);

            console.log("MOVED IT!")
            // Return true if we actually added this analysis to replay to the top cell
            return true;
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

            writeToCell(newActiveCell?.model, `import mitosheet\nmitosheet.sheet(${dataframeVariableName}, view_df=True)`);

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