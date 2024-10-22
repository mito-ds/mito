import { DiffComputer, IDiffComputerOpts, ILineChange } from "vscode-diff";

export interface UnifiedDiffLine {
    content: string;                   // The content of the line
    type: 'unchanged' | 'added' | 'removed'; // The type of change
    originalLineNumber: number | null; // Line number in the original code
    modifiedLineNumber: number | null; // Line number in the modified code
}

export const getCodeDiffLineRanges = (originalLines: string | undefined | null, modifiedLines: string | undefined | null): ILineChange[] => {
    if (originalLines === undefined || originalLines === null) {
        originalLines = ''
    }

    if (modifiedLines === undefined || modifiedLines === null) {
        modifiedLines = ''
    }

    const originalLinesArray = originalLines.split('\n')
    const modifiedLinesArray = modifiedLines.split('\n')

    console.log("originalLinesArray", originalLinesArray)
    console.log("modifiedLinesArray", modifiedLinesArray)

    let options: IDiffComputerOpts = {
        shouldPostProcessCharChanges: true,
        shouldIgnoreTrimWhitespace: true,
        shouldMakePrettyDiff: true,
        shouldComputeCharChanges: true,
        maxComputationTime: 0 // time in milliseconds, 0 => no computation limit.
    }

    let diffComputer = new DiffComputer(originalLinesArray, modifiedLinesArray, options);
    let lineChanges: ILineChange[] = diffComputer.computeDiff().changes;

    return lineChanges || []
}

export const getCodeWithDiffsMarked = (originalLines: string | undefined | null, modifiedLines: string | undefined | null): string => {

    /* 
        originalCodeLines: string
        newCodeLines: string
        allCodeLines: string
            - Ordered by line number with: 
                - Original code lines 
                - New Code Lines
        deletedLineIndexes: List[int]
        modifiedLineIndexes: List[int]
    */


    
    const lineChanges = getCodeDiffLineRanges(originalLines, modifiedLines);

    const diffedLines = originalLines?.split('\n') || []

    let numNewLinesAdded = 0
    for (const lineChange of lineChanges) {
        diffedLines[lineChange.originalStartLineNumber] = '<span style="background-color: red;">' + diffedLines[lineChange.originalStartLineNumber] + '</span>'
        numNewLinesAdded = numNewLinesAdded + 1
    }

    return "```python\n" + diffedLines.join('\n') + "\n```"
}

export const createUnifiedDiff = (
    originalCode: string | undefined | null,
    modifiedCode: string | undefined | null,
    lineChanges: ILineChange[]
): UnifiedDiffLine[] => {
    if (originalCode === undefined || originalCode === null) {
        originalCode = ''
    }

    if (modifiedCode === undefined || modifiedCode === null) {
        modifiedCode = ''
    }

    const originalLines = originalCode.split('\n')
    const modifiedLines = modifiedCode.split('\n')

    const result: UnifiedDiffLine[] = [];
    let originalLineNum = 1;
    let modifiedLineNum = 1;
    let changeIndex = 0;

    while (
        originalLineNum <= originalLines.length ||
        modifiedLineNum <= modifiedLines.length
    ) {
        if (changeIndex < lineChanges.length) {
            const change = lineChanges[changeIndex];

            // Process unchanged lines before the next change
            while (
                (originalLineNum < change.originalStartLineNumber ||
                    modifiedLineNum < change.modifiedStartLineNumber) &&
                originalLineNum <= originalLines.length &&
                modifiedLineNum <= modifiedLines.length
            ) {
                result.push({
                    content: originalLines[originalLineNum - 1],
                    type: 'unchanged',
                    originalLineNumber: originalLineNum,
                    modifiedLineNumber: modifiedLineNum,
                });
                originalLineNum++;
                modifiedLineNum++;
            }

            // Process the change
            if (
                change.originalEndLineNumber > 0 &&
                change.modifiedEndLineNumber > 0
            ) {
                // Modification
                for (
                    ;
                    originalLineNum <= change.originalEndLineNumber;
                    originalLineNum++
                ) {
                    result.push({
                        content: originalLines[originalLineNum - 1],
                        type: 'removed',
                        originalLineNumber: originalLineNum,
                        modifiedLineNumber: null,
                    });
                }
                for (
                    ;
                    modifiedLineNum <= change.modifiedEndLineNumber;
                    modifiedLineNum++
                ) {
                    result.push({
                        content: modifiedLines[modifiedLineNum - 1],
                        type: 'added',
                        originalLineNumber: null,
                        modifiedLineNumber: modifiedLineNum,
                    });
                }
            } else if (change.originalEndLineNumber === 0) {
                // Addition
                for (
                    ;
                    modifiedLineNum <= change.modifiedEndLineNumber;
                    modifiedLineNum++
                ) {
                    result.push({
                        content: modifiedLines[modifiedLineNum - 1],
                        type: 'added',
                        originalLineNumber: null,
                        modifiedLineNumber: modifiedLineNum,
                    });
                }
            } else if (change.modifiedEndLineNumber === 0) {
                // Deletion
                for (
                    ;
                    originalLineNum <= change.originalEndLineNumber;
                    originalLineNum++
                ) {
                    result.push({
                        content: originalLines[originalLineNum - 1],
                        type: 'removed',
                        originalLineNumber: originalLineNum,
                        modifiedLineNumber: null,
                    });
                }
            }
            changeIndex++;
        } else {
            // Process any remaining unchanged lines
            if (
                originalLineNum <= originalLines.length &&
                modifiedLineNum <= modifiedLines.length
            ) {
                result.push({
                    content: originalLines[originalLineNum - 1],
                    type: 'unchanged',
                    originalLineNumber: originalLineNum,
                    modifiedLineNumber: modifiedLineNum,
                });
                originalLineNum++;
                modifiedLineNum++;
            } else if (originalLineNum <= originalLines.length) {
                // Remaining lines were removed
                result.push({
                    content: originalLines[originalLineNum - 1],
                    type: 'removed',
                    originalLineNumber: originalLineNum,
                    modifiedLineNumber: null,
                });
                originalLineNum++;
            } else if (modifiedLineNum <= modifiedLines.length) {
                // Remaining lines were added
                result.push({
                    content: modifiedLines[modifiedLineNum - 1],
                    type: 'added',
                    originalLineNumber: null,
                    modifiedLineNumber: modifiedLineNum,
                });
                modifiedLineNum++;
            } else {
                break;
            }
        }
    }

    return result;
}