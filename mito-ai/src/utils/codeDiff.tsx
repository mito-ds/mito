import { DiffComputer, IDiffComputerOpts, ILineChange } from "vscode-diff";

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

    let originalLinesTest: string = "hello\noriginal\nworld";
    let modifiedLinesTest: string = "hello\nnew\nworld\nfoobar";
    
    const lineChanges = getCodeDiffLineRanges(originalLinesTest, modifiedLinesTest);

    const diffedLines = originalLinesTest.split('\n')

    let numNewLinesAdded = 0
    for (const lineChange of lineChanges) {
        diffedLines[lineChange.originalStartLineNumber] = '<span style="background-color: red;">' + diffedLines[lineChange.originalStartLineNumber] + '</span>'
        numNewLinesAdded = numNewLinesAdded + 1
    }

    console.log("diffedLines", diffedLines)

    return "```python\n" + diffedLines.join('\n') + "\n```"
}