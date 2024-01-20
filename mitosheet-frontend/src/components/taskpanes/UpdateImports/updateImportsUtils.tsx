import React from "react";
import { UserDefinedImportParams } from "../UserDefinedImport/UserDefinedImportTaskpane";
import { CSVImportParams } from "../../import/CSVImportConfigScreen";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportConfigScreen";
import { DataframeCreationData, ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane"


export function isCSVImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is CSVImportParams {
    return params !== undefined && 'file_names' in params && !('sheet_names' in params);
}
export function isExcelImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is ExcelImportParams {
    return params !== undefined && 'sheet_names' in params;
}
export function isDataframeImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is DataframeImportParams {
    return params !== undefined && 'df_names' in params;
}
export function isUserDefinedImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | UserDefinedImportParams | undefined): params is UserDefinedImportParams {
    return params !== undefined && 'importer' in params;
}

export const getBaseOfPath = (fullPath: string): string => {
    return fullPath.replace(/^.*[\\\\/]/, '')
}

export function updateStepImportDataList(stepImportDataList: StepImportData[], newDataframeCreationIndex: number, newDataframeCreationData: DataframeCreationData): StepImportData[]  {
    const newStepImportDataList = [...stepImportDataList];

    let numSeen = 0;
    newStepImportDataList.forEach(stepImportData => {
        if (numSeen + stepImportData.imports.length > newDataframeCreationIndex) {
            stepImportData.imports[newDataframeCreationIndex - numSeen] = newDataframeCreationData;
        }
        numSeen += stepImportData.imports.length;
    })

    return newStepImportDataList;
}

// We transform the step imports into a more helpful 
export const getAllDataframeCreationData = (stepImportDataList: StepImportData[] | undefined): DataframeCreationData[] => {
    if (stepImportDataList === undefined) {
        return [];
    }

    return stepImportDataList.map(stepImportData => {
        return stepImportData.imports;
    }).flat();
}

export const getOriginalAndUpdatedDataframeCreationDataPairs = (originalStepImportData: StepImportData[] | undefined, updatedStepImportData: StepImportData[] | undefined): [DataframeCreationData, DataframeCreationData][] => {
    const originalImports = getAllDataframeCreationData(originalStepImportData);
    // We handle the case the original imports have been loaded, btu the newImports have not yet been loaded
    const newImports = originalStepImportData !== undefined && updatedStepImportData === undefined ? originalImports : getAllDataframeCreationData(updatedStepImportData);

    return originalImports.map((dfCreationData, index): [DataframeCreationData, DataframeCreationData] => {
        return [dfCreationData, newImports[index]];
    })
}

export const updateDataframeCreation = (
    dataframeCreationIndex: number,
    dataframeCreationData: DataframeCreationData,
    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>,
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>,
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>,
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>
): void => {

    // First, update the stepImportData
    setUpdatedStepImportData((prevUpdatedStepImportData) => {
        if (prevUpdatedStepImportData === undefined) {
            return undefined;
        }
        return updateStepImportDataList(
            prevUpdatedStepImportData, 
            dataframeCreationIndex, 
            dataframeCreationData
        )
    })

    // Save that this index is updated
    setUpdatedIndexes((prevUpdatedIndexes) => {
        if (prevUpdatedIndexes.includes(dataframeCreationIndex)) {
            return prevUpdatedIndexes;
        }
        const newUpdatedIndexes = [...prevUpdatedIndexes];
        newUpdatedIndexes.push(dataframeCreationIndex);
        return newUpdatedIndexes;
    })

    // Remove the invalid import message if it exists
    setInvalidImportMessages(prevInvalidImportMessage => {
        const newInvalidImportMessage = {...prevInvalidImportMessage};
        if (newInvalidImportMessage[dataframeCreationIndex] !== undefined) {
            delete newInvalidImportMessage[dataframeCreationIndex]
        }
        return newInvalidImportMessage;
    })

    // And mark that we are done replacing this dataframe creation
    setReplacingDataframeState(undefined);
}

export const updateAllSnowflakeImports = (
    updatedStepImportData: StepImportData[] | undefined,
    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>,
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>,
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>,
    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>
): void => {
    if (updatedStepImportData === undefined) {
        return
    }

    updatedStepImportData.forEach((updatedStepImport, idx) => {
        if (updatedStepImport.imports[0].step_type === 'snowflake_import') {
            updateDataframeCreation(
                idx,
                updatedStepImport.imports[0],
                setUpdatedStepImportData,
                setUpdatedIndexes,
                setInvalidImportMessages,
                setReplacingDataframeState
            )
        }
    })
}

export const getErrorTextFromToFix = (toFix: string): string => {
    return toFix + " Update imports to fix this error.";
}