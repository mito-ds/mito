import { CSVImportData, DataframeImportData, ExcelImportData } from "./UpdateImportsTaskpane"

export function isCSVImportData(importData: CSVImportData | ExcelImportData | DataframeImportData): importData is CSVImportData {
    return 'delimeters' in importData.params;
}
export function isExcelImportData(importData: CSVImportData | ExcelImportData | DataframeImportData): importData is ExcelImportData {
    return 'sheet_names' in importData.params;
}
export function isDataframeImportData(importData: CSVImportData | ExcelImportData | DataframeImportData): importData is CSVImportData {
    return 'df_names' in importData.params;
}