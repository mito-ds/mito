// Utilities for working with the generated code

import { PublicInterfaceVersion } from "../types";


const IMPORT_STATEMENTS: Record<PublicInterfaceVersion, string> = {
    1: 'from mitosheet.public.v1 import *',
    2: 'from mitosheet.public.v2 import *',
    3: 'from mitosheet.public.v3 import *'
}


export function getCodeString(
    analysisName: string,
    code: string[],
    telemetryEnabled: boolean,
    publicInterfaceVersion: PublicInterfaceVersion
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

    const importStatement = IMPORT_STATEMENTS[publicInterfaceVersion]

    // If telemetry not enabled, we want to be clear about this by
    // simply not calling a func w/ the analysis name
    if (telemetryEnabled) {
        return `${importStatement}; register_analysis("${analysisName}");
${finalCode}`
    } else {
        return `${importStatement}; # Analysis Name:${analysisName};
${finalCode}`
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

    // Check if it starts with any import statement from the versioned interface
    let startsWithPublicVersionImport = false;
    Object.values(IMPORT_STATEMENTS).forEach(importStatement => {
        if (codeText.startsWith(importStatement + '; register_analysis(' ) || codeText.startsWith(importStatement + '; # Analysis Name:' )) {
            startsWithPublicVersionImport = true;
        } 
    })

    // Handle the old and new Mito boilerplate code
    return codeText.startsWith('# MITO CODE START') 
        || codeText.startsWith('from mitosheet import *; register_analysis(')
        || codeText.startsWith('from mitosheet import *; # Analysis:')
        || codeText.startsWith('from mitosheet import *; # Analysis Name:')
        || startsWithPublicVersionImport
}


/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithSpecificAnalysisToReplay(codeText: string, analysisName: string): boolean {
    // Remove any whitespace from codeText
    const codeTextCleaned = codeText.replace(/\s/g, '');
    return codeTextCleaned.includes('sheet(') && codeTextCleaned.includes(`analysis_to_replay="${analysisName}"`)
}


/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithAnyAnalysisToReplay(codeText: string): boolean {
    // Remove any whitespace from codeText
    const codeTextCleaned = codeText.replace(/\s/g, '');
    return isMitosheetCallCode(codeText) && codeTextCleaned.includes(`analysis_to_replay=`)
}


/* 
    Returns true if the cell contains the code generated for a specific analysis name
*/
export function containsGeneratedCodeOfAnalysis(codeText: string, analysisName: string): boolean {
    return isMitoAnalysisCode(codeText) && codeText.includes(analysisName);
}