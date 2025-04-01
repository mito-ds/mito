/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { DiffComputer, IDiffComputerOpts, ILineChange } from "vscode-diff";

export interface UnifiedDiffLine {
    content: string;                   // The content of the line
    type: 'unchanged' | 'inserted' | 'removed'; // The type of change
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

    const options: IDiffComputerOpts = {
        shouldPostProcessCharChanges: true,
        shouldIgnoreTrimWhitespace: true,
        shouldMakePrettyDiff: true,
        shouldComputeCharChanges: true,
        maxComputationTime: 0 // time in milliseconds, 0 => no computation limit.
    }

    const diffComputer = new DiffComputer(originalLinesArray, modifiedLinesArray, options);
    const lineChanges: ILineChange[] = diffComputer.computeDiff().changes;

    return lineChanges || []
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

    /* 
    Algorithm explanation:
    
    This function creates a unified diff by comparing the original and modified code.
    It iterates through both versions of the code simultaneously, creating a new representation
    of the code called result that is UnifiedDiffLine[]. Each time the algorithm sees a new line 
    of code, it adds it to the result, marking it as unchanged, removed, or inserted.

    The algorithm works as follows:
    1. Process unchanged lines until a change is encountered.
    2. When a change is found, handle it based on its type:
        a. Modification: Mark original lines as removed, mark modified lines as inserted.
        b. Inserted: Add new lines from the modified code and mark as Inserted.
        c. Removed: Add removed lines from the original code to the result and mark as Removed.
    3. After processing all changes, handle any remaining lines.
    The result is a unified diff that shows all changes in context.
    */

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

            if (change === undefined) {
                break;
            }

            // Process unchanged lines before the next change
            while (
                (originalLineNum < change.originalStartLineNumber ||
                    modifiedLineNum < change.modifiedStartLineNumber) &&
                originalLineNum <= originalLines.length &&
                modifiedLineNum <= modifiedLines.length
            ) {
                result.push({
                    content: originalLines[originalLineNum - 1] ?? '',
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
                // First add removed lines
                for (;originalLineNum <= change.originalEndLineNumber; originalLineNum++) {
                    result.push({
                        content: originalLines[originalLineNum - 1] ?? '',
                        type: 'removed',
                        originalLineNumber: originalLineNum,
                        modifiedLineNumber: null,
                    });
                }
                // Then add inserted lines
                for (;modifiedLineNum <= change.modifiedEndLineNumber; modifiedLineNum++) {
                    result.push({
                        content: modifiedLines[modifiedLineNum - 1] ?? '',
                        type: 'inserted',
                        originalLineNumber: null,
                        modifiedLineNumber: modifiedLineNum,
                    });
                }
            } else if (change.originalEndLineNumber === 0) {
                // Inserted Lines
                for (;modifiedLineNum <= change.modifiedEndLineNumber;modifiedLineNum++) {
                    result.push({
                        content: modifiedLines[modifiedLineNum - 1] ?? '',
                        type: 'inserted',
                        originalLineNumber: null,
                        modifiedLineNumber: modifiedLineNum,
                    });
                }
            } else if (change.modifiedEndLineNumber === 0) {
                // Removed lines
                for (;originalLineNum <= change.originalEndLineNumber; originalLineNum++) {
                    result.push({
                        content: originalLines[originalLineNum - 1] ?? '',
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
                    content: originalLines[originalLineNum - 1] ?? '',
                    type: 'unchanged',
                    originalLineNumber: originalLineNum,
                    modifiedLineNumber: modifiedLineNum,
                });
                originalLineNum++;
                modifiedLineNum++;
            } else if (originalLineNum <= originalLines.length) {
                // Remaining lines were removed
                result.push({
                    content: originalLines[originalLineNum - 1] ?? '',
                    type: 'removed',
                    originalLineNumber: originalLineNum,
                    modifiedLineNumber: null,
                });
                originalLineNum++;
            } else if (modifiedLineNum <= modifiedLines.length) {
                // Remaining lines were added
                result.push({
                    content: modifiedLines[modifiedLineNum - 1] ?? '',
                    type: 'inserted',
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


export const getCodeDiffsAndUnifiedCodeString = (originalCode: string | undefined | null, modifiedCode: string | undefined | null): {
    unifiedCodeString: string;
    unifiedDiffs: UnifiedDiffLine[];
} => {

    const lineChanges = getCodeDiffLineRanges(originalCode, modifiedCode)
    const unifiedDiffs = createUnifiedDiff(originalCode, modifiedCode, lineChanges)

    const unifiedCodeString = (unifiedDiffs.map(line => {
        return line.content !== undefined ? line.content : ''
    }).join('\n'))

    return {
        unifiedCodeString,
        unifiedDiffs
    }
}