import { UIState } from "../../../types";
import { DataframeImportParams } from "../../import/DataframeImportScreen"
import { CSVImportParams } from "../../import/CSVImportScreen";
import { ExcelImportParams } from "../../import/XLSXImportScreen";
import { TaskpaneType } from "../taskpanes";
import { UpdatedImportObj } from "./UpdateImportsTaskpane"

export interface UpdateImportData {
    updatedImportObjs: UpdatedImportObj[],
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

    const newUpdatedImportObjs: UpdatedImportObj[] = JSON.parse(JSON.stringify(updateImportedData.updatedImportObjs))
    const importIndex = updateImportedData.importIndex

    newUpdatedImportObjs[importIndex] = {
        ...newUpdatedImportObjs[importIndex],
        type: 'df', 
        import_params: newImportParams
    }

    setUIState(prevUIState => {
        return {
            ...prevUIState,
            currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImportObjs: newUpdatedImportObjs}
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

    const newUpdatedImportObjs: UpdatedImportObj[] = JSON.parse(JSON.stringify(updateImportedData.updatedImportObjs))
    const importIndex = updateImportedData.importIndex

    if (Object.keys(newImportParams).includes('sheet_names')) {
        newImportParams = newImportParams as ExcelImportParams
        newUpdatedImportObjs[importIndex] = {
            ...newUpdatedImportObjs[importIndex],
            type: 'excel',
            import_params: newImportParams
        }
    } else {
        newImportParams = newImportParams as CSVImportParams
        newUpdatedImportObjs[importIndex] = {
            ...newUpdatedImportObjs[importIndex],
            type: 'csv', 
            import_params: newImportParams
        }
    }

    setUIState(prevUIState => {
        return {
            ...prevUIState,
            currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS, updatedImportObjs: newUpdatedImportObjs}
        }
    })
}