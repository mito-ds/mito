import { CSVImportParams } from "../../import/CSVImportScreen";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportScreen";
import { CSVImportData, DataframeCreationData, DataframeImportData, ExcelImportData, StepImportData } from "./UpdateImportsTaskpane"


export function isCSVImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is CSVImportParams {
    return params !== undefined && 'file_names' in params && !('sheet_names' in params);
}
export function isExcelImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is ExcelImportParams {
    return params !== undefined && 'sheet_names' in params;
}
export function isDataframeImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is DataframeImportParams {
    return params !== undefined && 'df_names' in params;
}
export function isCSVImportData(importData: CSVImportData | ExcelImportData | DataframeImportData): importData is CSVImportData {
    return isCSVImportParams(importData.params);
}
export function isExcelImportData(importData: CSVImportData | ExcelImportData | DataframeImportData): importData is ExcelImportData {
    return isExcelImportParams(importData.params);
}
export function isDataframeImportData(importData: CSVImportData | ExcelImportData | DataframeImportData): importData is CSVImportData {
    return isDataframeImportParams(importData.params);
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