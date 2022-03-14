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
import { Code } from './types';

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
        return `from mitosheet import *; register_analysis('${analysisName}')
    ${finalCode}`
    } else {
        return `from mitosheet import *; # Analysis:${analysisName}
    ${finalCode}`
    }

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
*/
function getAnalysisName(codeblock: string): string | undefined {
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
    Returns true if the cell contains the 
    generated code for the analysis name
*/
function containsAnalysisName(cell: ICellModel | undefined, analysisName: string): boolean {
    const currentCode = getCellText(cell);
    return currentCode.includes(analysisName);
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

    /*
        We define a command here, so that we can call it elsewhere in the
        app - and here is the only place we have access to the app (which we
        need to be able to add commands) and tracker (which we need to get
        the current notebook).
    */
    app.commands.addCommand('write-code-to-cell', {
        label: 'Write Mito Code to a Cell',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (args: any) => {
            /*
                Given an analysisName and code, this writes the code to the cell

                If there is already a cell that contains this analysis name, than
                this call will overwrite that cell, as we now want the updated code.

                If there is not a cell that contains this analysis name, then we try
                and figure out if we're in a call with a mitosheet.sheet call, and 
                if so write below that (avoiding overwriting existing code). If we're
                in an anlaysis cell, we just overwrite that.
            */
                    
            const analysisName = args.analysisName as string;
            // TODO: update the code type name!
            const codeObj = args.code as Code;
            const overwriteIfCodeEmpty = args.overwriteIfCodeEmpty;
            const telemetryEnabled = args.telemetryEnabled as boolean;

            // This is the code that was passed to write to the cell.
            const code = codeContainer(analysisName, codeObj.code, telemetryEnabled);

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;
            const cells = notebook?.model?.cells;

            if (notebook == undefined || cells == undefined) {
                return;
            }

            // First, we try and find a cell with this analysis name, 
            // and overwrite it
            const cellsIterator = cells.iter();
            let cell = cellsIterator.next();
            while (cell) {
                if (containsAnalysisName(cell, analysisName)) {
                    writeToCell(cell, code);
                    return;
                }

                cell = cellsIterator.next();
            }

            const activeCell = notebook.activeCell;
            const activeCellIndex = notebook.activeCellIndex;

            if (isMitosheetSheetCell(activeCell?.model)) {
                const nextCell = getCellAtIndex(cells, activeCellIndex + 1)
                if (isMitoAnalysisCell(nextCell) || isEmptyCell(nextCell)) {
                    // If the next cell contains a mito analysis, we overwrite it
                    writeToCell(nextCell, code);
                } else {
                    // Otherwise, we insert a cell below and write to that. 
                    NotebookActions.insertBelow(notebook);
                    const newNextCell = getCellAtIndex(cells, activeCellIndex + 1);
                    writeToCell(newNextCell, code);
                }
            } else {
                // We assume the current cell is where the analysis should be written
                if (isMitoAnalysisCell(activeCell?.model)) {
                    // If this is already analysis, we overwrite it, if the arguments says to
                    if (overwriteIfCodeEmpty) {
                        writeToCell(activeCell?.model, code);
                    }
                } else {
                    // Otherwise, we insert a cell above, and write to that, if the current cell is not empty
                    if (!isEmptyCell(activeCell?.model)) {
                        NotebookActions.insertAbove(notebook);
                    }
                    // New cell is the previous cell, now
                    const prevCell = notebook.activeCell;
                    writeToCell(prevCell?.model, code);
                }
            }
        }
    });

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
            
                // If there is a analysis name parameter passed, we ignore it
                if (nameString.includes('saved_analysis_name')) {
                    nameString = nameString.split('saved_analysis_name')[0].trim();
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

    app.commands.addCommand('read-existing-analysis', {
        label: 'Reads any existing mito analysis from the previous cell, and returns the saved ColumnSpreadsheetCodeJSON, if it exists.',
        execute: (): string | undefined => {
        /*
            This should _only_ run right after the mitosheet.sheet call is run, 
            and so the currently selected cell is the cell that actually contains the mito
            analysis.
        */

            // We get the current notebook (currentWidget)
            const notebook = tracker.currentWidget?.content;

            if (!notebook) return undefined;

            // We get the previous cell to the current active cell
            const activeCell = notebook.activeCell;

            if (activeCell) {
                // remove the df argument to mitosheet.sheet() from the cell's text
                const previousValue = activeCell.model.modelDB.get('value') as IObservableString;
                return getAnalysisName(previousValue.text);
            } 
            return undefined;
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
            let currentElement = document.activeElement;
            while (currentElement !== null) {
                if (currentElement.classList.contains('mito-container')) {
                    break;
                }
                currentElement = currentElement.parentElement;
            }

            // If we cannot find the container this was in, we return.
            // This should never happen
            if (currentElement === null) {
                return;
            }

            // Get the search input, and click + focus on it
            const searchInput = currentElement.querySelector('#action-search-bar-id') as HTMLInputElement | null;
            if (searchInput === null) {
                return;
            }

            // Focusing on the searchInput so that we begin typing there
            searchInput.focus();
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