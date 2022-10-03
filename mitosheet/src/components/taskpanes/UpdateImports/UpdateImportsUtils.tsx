import { CSVImportParams } from "../../import/CSVImportScreen";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportScreen";
import { CSVImportData, DataframeImportData, ExcelImportData } from "./UpdateImportsTaskpane"


export function isCSVImportParams(params: CSVImportParams | ExcelImportParams | DataframeImportParams | undefined): params is CSVImportParams {
    return params !== undefined && 'delimeters' in params;
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