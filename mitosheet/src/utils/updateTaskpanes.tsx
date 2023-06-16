import MitoAPI from "../api/api";
import { ModalEnum } from "../components/modals/modals";
import { TaskpaneType } from "../components/taskpanes/taskpanes";
import { UIState } from "../types";

export const openExistingMergeTaskpane = async (
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): Promise<void> => {
    const response = await mitoAPI.getMergeParams(selectedSheetIndex);
    const existingMergeParams = 'error' in response ? undefined : response.result;

    if (existingMergeParams !== undefined) {
        setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenModal: {type: ModalEnum.None},
                currOpenTaskpane: {
                    type: TaskpaneType.MERGE,
                    destinationSheetIndex: selectedSheetIndex,
                    existingMergeParams: existingMergeParams
                },
                selectedTabType: 'data'
            }
        })
    }
}

export const openExistingPivotTaskpane = async (
    mitoAPI: MitoAPI,
    selectedSheetIndex: number,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): Promise<void> => {
    const response = await mitoAPI.getPivotParams(selectedSheetIndex);
    const existingPivotParams = 'error' in response ? undefined : response.result;

    if (existingPivotParams !== undefined) {
        setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenModal: {type: ModalEnum.None},
                currOpenTaskpane: {
                    type: TaskpaneType.PIVOT,
                    sourceSheetIndex: existingPivotParams.sheet_index,
                    destinationSheetIndex: selectedSheetIndex,
                    existingPivotParams: existingPivotParams
                },
                selectedTabType: 'data'
            }
        })
    }
}