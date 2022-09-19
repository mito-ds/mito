// Utilities for working with the generated code

export function getCodeString(
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
export function getAnalysisNameFromOldGeneratedCode(codeString: string): string | undefined {
    if (codeString.includes('register_analysis("') || codeString.includes("Analysis Name:")) {
        // Return nothing for formats 5 and 6
        return;
    }

    if (codeString.includes('SAVED-ANALYSIS-START')) {
        // Format 1
        return codeString.substring(
            codeString.indexOf('SAVED-ANALYSIS-START') + 'SAVED-ANALYSIS-START'.length,
            codeString.indexOf('SAVED-ANALYSIS-END')
        );
    } else if (codeString.includes('register_analysis') && codeString.includes('# Let Mito know')) {
        // Format 2
        return codeString.substring(
            codeString.indexOf('register_analysis(\'') + 'register_analysis(\''.length,
            codeString.indexOf('# Let Mito know') - 3
        );
    } else if (codeString.includes('register_analysis')) {
        // Format 3
        return codeString.substring(
            codeString.indexOf('register_analysis(\'') + 'register_analysis(\''.length,
            codeString.indexOf('\n') - 2
        );
    } else if (codeString.includes('# Analysis:')) {
        // Format 4:
        return codeString.substring(
            codeString.indexOf('Analysis:') + 'Analysis:'.length,
            codeString.indexOf('\n')
        );

    } else {
        // Otherwise, there is no saved analysis in this cell
        return undefined;
    }    
}

// Returns the last line with any non-whitespace character
export function getLastNonEmptyLine(codeText: string): string | undefined {
    const filteredActiveText = codeText.split(/\r?\n/).filter(line => line.trim().length > 0)
    return filteredActiveText.length > 0 ? filteredActiveText.pop() : undefined
}

export const getArgsFromMitosheetCallCode = (codeText: string): string[] => {
    let nameString = codeText.split('sheet(')[1].split(')')[0];

    // If there is a (new) analysis name parameter passed, we ignore it
    if (nameString.includes('analysis_to_replay')) {
        nameString = nameString.split('analysis_to_replay')[0].trim();
    }

    // If there is a view_df name parameter, we ignore it
    // TODO: remove this on Jan 1, 2023 (since we no longer need it)
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


// Returns true iff a the given cell ends with a mitosheet.sheet call
export function isMitosheetCallCode(codeText: string): boolean {

    // Get the last non-empty line from the cell
    const lastLine = getLastNonEmptyLine(codeText);
    if (lastLine === undefined) {
        return false;
    }
    /* 
        We check if the last line contains a mitosheet.sheet call, which can happen in a few ways
        
        1. `import mitosheet` -> mitosheet.sheet()
        2. `import mitosheet as {THING}` -> {THING}.sheet(
        3. `from mitosheet import sheet` -> sheet(

        We detect all three by checking if the line contains `sheet(`!
    */

    return lastLine.indexOf('sheet(') !== -1;
}



// Returns true iff a the given cell is a cell containing the generated code
export function isMitoAnalysisCode(codeText: string): boolean {
    // Handle the old and new Mito boilerplate code
    return codeText.startsWith('# MITO CODE START') 
        || codeText.startsWith('from mitosheet import *; register_analysis(')
        || codeText.startsWith('from mitosheet import *; # Analysis:')
        || codeText.startsWith('from mitosheet import *; # Analysis Name:')
}


/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithSpecificAnalysisToReplay(codeText: string, analysisName: string): boolean {
    return codeText.includes('sheet(') && codeText.includes(`analysis_to_replay="${analysisName}"`)
}


/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithAnyAnalysisToReplay(codeText: string): boolean {
    return isMitosheetCallCode(codeText) && codeText.includes(`analysis_to_replay=`)
}


/* 
    Returns true if the cell contains the code generated for a specific analysis name
*/
export function containsGeneratedCodeOfAnalysis(codeText: string, analysisName: string): boolean {
    return isMitoAnalysisCode(codeText) && codeText.includes(analysisName);
}