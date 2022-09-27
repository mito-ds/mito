import { UIState } from "../../../types";
import { DataframeImportParams } from "../DataframeImport/DataframeImportTaskpane"
import { CSVImportParams } from "../Import/CSVImport";
import { ExcelImportParams } from "../Import/XLSXImport";
import { TaskpaneType } from "../taskpanes";
import { UpdatedImport } from "./UpdateImportsTaskpane"

export interface UpdateImportData {
    updatedImports: UpdatedImport[],
    importIndex: number
}


export const updateImportedDataWithDataframe = (
    updateImportedData: UpdateImportData | undefined, 
    newImportParams: DataframeImportParams,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): void => {
    if (updateImportedData === undefined) {
        return 
    }

    const newUpdatedImports: UpdatedImport[] = JSON.parse(JSON.stringify(updateImportedData.updatedImports))
    const importIndex = updateImportedData.importIndex

    newUpdatedImports[importIndex] = {
        ...newUpdatedImports[importIndex],
        type: 'df', 
        import_params: newImportParams
    }

    setUIState(prevUIState => {
        return {
            ...prevUIState,
            currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImports: newUpdatedImports}
        }
    })
}

export const updateImportedDataWithFile = (
    updateImportedData: UpdateImportData | undefined, 
    newImportParams: CSVImportParams | ExcelImportParams,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): void => {
    if (updateImportedData === undefined) {
        return 
    }

    const newUpdatedImports: UpdatedImport[] = JSON.parse(JSON.stringify(updateImportedData.updatedImports))
    const importIndex = updateImportedData.importIndex

    if (Object.keys(newImportParams).includes('sheet_names')) {
        newImportParams = newImportParams as ExcelImportParams
        newUpdatedImports[importIndex] = {
            ...newUpdatedImports[importIndex],
            type: 'excel',
            import_params: newImportParams
        }
    } else {
        newImportParams = newImportParams as CSVImportParams
        newUpdatedImports[importIndex] = {
            ...newUpdatedImports[importIndex],
            type: 'csv', 
            import_params: newImportParams
        }
    }

    setUIState(prevUIState => {
        return {
            ...prevUIState,
            currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImports: newUpdatedImports}
        }
    })
}