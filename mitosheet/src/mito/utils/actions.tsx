/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import fscreen from "fscreen";
import { getCodeString } from "../../jupyter/code";
import { MitoAPI, getRandomId } from "../api/api";
import { SendFunctionStatus } from "../api/send";
import { DEFAULT_SUPPORT_EMAIL } from "../components/elements/GetSupportButton";
import { getStartingFormula } from "../components/endo/celleditor/cellEditorUtils";
import { getColumnIndexesInSelections, getSelectedColumnIDsWithEntireSelectedColumn, getSelectedNumberSeriesColumnIDs, getSelectedRowLabelsInSingleSelection, getSelectedRowLabelsWithEntireSelectedRow, isSelectionsOnlyColumnHeaders } from "../components/endo/selectionUtils";
import { doesAnySheetExist, doesColumnExist, doesSheetContainData, getCellDataFromCellIndexes, getDataframeIsSelected, getAnyGraphIsSelected } from "../components/endo/utils";
import AIIcon from "../components/icons/AIIcon";
import AddColumnIcon from "../components/icons/AddColumnIcon";
import AntiMergeIcon from "../components/icons/AntiMergeIcon";
import BulkHeaderTransformIcon from "../components/icons/BulkColumnHeaderTransformIcon";
import CatchUpIcon from "../components/icons/CatchUpIcon";
import ClearIcon from "../components/icons/ClearIcon";
import CodeSnippetIcon from "../components/icons/CodeSnippetIcon";
import ConcatIcon from "../components/icons/ConcatIcon";
import ConditionalFormatIcon from "../components/icons/ConditionalFormatIcon";
import CopyContextMenuIcon from "../components/icons/CopyContextMenuItem";
import CopyIcon from "../components/icons/CopyIcon";
import CurrencyIcon from "../components/icons/CurrencyIcon";
import DataFrameImportIcon from "../components/icons/DataFrameImportIcon";
import DateTimeFunctionsIcon from "../components/icons/DateTimeFunctionsIcon";
import DeleteColumnIcon from "../components/icons/DeleteColumnIcon";
import DtypeIcon from "../components/icons/DtypeIcon";
import EditIcon from "../components/icons/EditIcon";
import ExportIcon from "../components/icons/ExportIcon";
import FileImportIcon from "../components/icons/FileImportIcon";
import FillNanIcon from "../components/icons/FillNanIcon";
import { FilterIcon } from "../components/icons/FilterIcons";
import FinancialFunctionsIcon from "../components/icons/FinancialFunctionsIcon";
import FormatContextMenuIcon from "../components/icons/FormatContextMenuIcon";
import FormatIcon from "../components/icons/FormatIcon";
import FunctionIcon from "../components/icons/FunctionIcon";
import GearIcon from "../components/icons/GearIcon";
import GraphIcon from "../components/icons/GraphIcon";
import ImportIcon from "../components/icons/ImportIcon";
import LessIcon from "../components/icons/LessIcon";
import LineChartIcon from "../components/icons/LineChartIcon";
import LogicalFunctionsIcon from "../components/icons/LogicalFunctionsIcon";
import MathFunctionsIcon from "../components/icons/MathFunctionsIcon";
import MergeIcon from "../components/icons/MergeIcon";
import MoreFunctionsIcon from "../components/icons/MoreFunctionsIcon";
import MoreIcon from "../components/icons/MoreIcon";
import NumberFormatIcon from "../components/icons/NumberFormatIcon";
import OneHotEncodingIcon from "../components/icons/OneHotEncodingIcon";
import PercentIcon from "../components/icons/PercentIcon";
import PivotIcon from "../components/icons/PivotIcon";
import PlusIcon from "../components/icons/PlusIcon";
import PromoteToHeaderIcon from "../components/icons/PromoteToHeaderIcon";
import RedoIcon from "../components/icons/RedoIcon";
import LookupFunctionsIcon from "../components/icons/ReferenceFunctionsIcons";
import RemoveDuplicatesIcon from "../components/icons/RemoveDuplicatesIcon";
import ResetAndDropIndexIcon from "../components/icons/ResetAndDropIndexIcon";
import ResetIcon from "../components/icons/ResetIcon";
import ResetIndexIcon from "../components/icons/ResetIndexIcon";
import ScatterPlotIcon from "../components/icons/ScatterPlotIcon";
import ScheduleIcon from "../components/icons/ScheduleIcon";
import SearchIcon from "../components/icons/SearchIcon";
import SnowflakeIcon from "../components/icons/SnowflakeIcon";
import SortAscendingIcon from "../components/icons/SortAscendingIcon";
import SortDescendingIcon from "../components/icons/SortDescendingIcon";
import SortIcon from "../components/icons/SortIcon";
import StarIcon from "../components/icons/StarIcon";
import SummaryIcon from "../components/icons/SummaryIcon";
import TextFunctionsIcon from "../components/icons/TextFunctionsIcon";
import TextToColumnsIcon from "../components/icons/TextToColumnsIcon";
import TransposeIcon from "../components/icons/TransposeIcon";
import TrashIcon from "../components/icons/TrashIcon";
import UndoIcon from "../components/icons/UndoIcon";
import UnpivotIcon from "../components/icons/UnpivotIcon";
import { ModalEnum } from "../components/modals/modals";
import { ControlPanelTab } from "../components/taskpanes/ControlPanel/ControlPanelTaskpane";
import { ColumnDtypes } from "../components/taskpanes/ControlPanel/FilterAndSortTab/DtypeCard";
import { SortDirection } from "../components/taskpanes/ControlPanel/FilterAndSortTab/SortCard";
import { getEqualityFilterCondition } from "../components/taskpanes/ControlPanel/FilterAndSortTab/filter/filterUtils";
import { GraphType } from "../components/taskpanes/Graph/GraphSetupTab";
import { deleteGraphs, openGraphSidebar } from "../components/taskpanes/Graph/graphUtils";
import { MergeType } from "../components/taskpanes/Merge/MergeTaskpane";
import { ALLOW_UNDO_REDO_EDITING_TASKPANES, TaskpaneType } from "../components/taskpanes/taskpanes";
import { DISCORD_INVITE_LINK } from "../data/documentationLinks";
import { getDefaultDataframeFormat } from "../pro/taskpanes/SetDataframeFormat/SetDataframeFormatTaskpane";
import { Action, ActionEnum, AnalysisData, BuildTimeAction, DFSource, DataframeFormat, EditorState, FilterType, GridState, NumberColumnFormatEnum, RunTimeAction, SheetData, UIState, UserProfile } from "../types";
import { getColumnHeaderParts, getColumnIDByIndex, getDisplayColumnHeader, getNewColumnHeader } from "./columnHeaders";
import { getCopyStringForClipboard, writeTextToClipboard } from "./copy";
import { FORMAT_DISABLED_MESSAGE, changeFormatOfColumns, decreasePrecision, increasePrecision } from "./format";
import { getDisplayNameOfPythonVariable } from './userDefinedFunctionUtils';
import AddChartElementIcon from "../components/icons/GraphToolbar/AddChartElementIcon";
import SelectDataIcon from "../components/icons/GraphToolbar/SelectDataIcon";

/**
 * This is a wrapper class that holds all frontend actions. This allows us to create and register
 * behavior in a single place, and be able to inject it across the entire app. 
 * 
 * There are two types of actions:
 *  1.  Build-time actions. These include adding a column, opening a taskpane, etc. Things we know, as the developers, that
 *      users are going to want to do. 
 *  2.  Run-time actions. These are actions we want to create and register in one place, but we do not know as developers. 
 *      For example, this might include user defined imports, or opening user defined edit taskpanes.  
 */
export class Actions {
    buildTimeActions: Record<ActionEnum, BuildTimeAction>;
    runtimeImportActionsList: RunTimeAction[]
    runtimeEditActionsList: RunTimeAction[]

    constructor(
        buildTimeActions: Record<ActionEnum, BuildTimeAction>,
        runtimeImportActionsList: RunTimeAction[],
        runTimeEditActionsList: RunTimeAction[]
    ) {
        this.buildTimeActions = buildTimeActions;
        this.runtimeImportActionsList = runtimeImportActionsList;
        this.runtimeEditActionsList = runTimeEditActionsList;
    }
}


export const getDefaultActionsDisabledMessage = (
    uiState: UIState,
    sendFunctionStatus: SendFunctionStatus
): string | undefined => {
    let defaultActionDisabledMessage: string | undefined = undefined;
    const disabledDueToReplayAnalysis = uiState.currOpenTaskpane.type === TaskpaneType.UPDATEIMPORTS && uiState.currOpenTaskpane.failedReplayData !== undefined;
    if (disabledDueToReplayAnalysis) {
        defaultActionDisabledMessage = 'Please resolve issues with the failed replay analysis before making further edits.';
    } else if (sendFunctionStatus === 'loading') {
        defaultActionDisabledMessage = 'Mito is still trying to connect to the backend. Please wait a moment.';
    } else if (sendFunctionStatus === 'non_working_extension_error') {
        defaultActionDisabledMessage = 'Mito is installed incorrectly. Please fix your installation and try again.';
    } else if (sendFunctionStatus === 'non_valid_location_error') {
        defaultActionDisabledMessage = 'Mito does not currently support this location. Please use Mito in JupyerLab or Jupter Notebooks.';
    } else if (sendFunctionStatus === 'no_backend_comm_registered_error') {
        defaultActionDisabledMessage = 'Kernel has been restarted. Please rerun the cell that created this mitosheet.';
    }
    return defaultActionDisabledMessage;
}

export const getActions = (
    sheetDataArray: SheetData[], 
    gridState: GridState,
    dfSources: DFSource[],
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    uiState: UIState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    mitoAPI: MitoAPI,
    mitoContainerRef: React.RefObject<HTMLDivElement>,
    analysisData: AnalysisData,
    userProfile: UserProfile,
    sendFunctionStatus: SendFunctionStatus,
): Actions => {
    // Define variables that we use in many actions
    const sheetIndex = gridState.sheetIndex;
    const sheetData = sheetDataArray[sheetIndex];
    const dfFormat: DataframeFormat = (sheetData?.dfFormat || getDefaultDataframeFormat());
    const startingRowIndex = gridState.selections[gridState.selections.length - 1].startingRowIndex;
    const startingColumnIndex = gridState.selections[gridState.selections.length - 1].startingColumnIndex;
    const {columnID, cellValue, columnDtype } = getCellDataFromCellIndexes(sheetData, startingRowIndex, startingColumnIndex);
    const {startingColumnFormula, arrowKeysScrollInFormula} = getStartingFormula(sheetData, undefined, startingRowIndex, startingColumnIndex, analysisData.defaultApplyFormulaToColumn);
    const startingColumnID = columnID;
    const lastStepSummary = analysisData.stepSummaryList[analysisData.stepSummaryList.length - 1];

    // If the replay analysis taskpane is open due to a failed replay analysis, we pretty much disable all actions
    // as the user needs to resolve these errors or start a new analysis
    const defaultActionDisabledMessage: string | undefined = getDefaultActionsDisabledMessage(uiState, sendFunctionStatus);

    /*
        All of the actions that can be taken from the Action Search Bar. 
        Note: This doesn't represent *every* action that can be taken in the app. 
        For example, the Filter action opens the column control panel, but it doesn't
        actually create a filter. That is handled by the taskpane. 

        The actions are listed in 2 sections, both in alphabetical order: non-spreadsheet formulas, 
        followed by all of the spreadsheet formulas. 
    */
    const buildTimeActions: Record<ActionEnum, BuildTimeAction> = {
        [ActionEnum.Add_Column_Right]: {
            type: 'build-time',
            staticType: ActionEnum.Add_Column_Right,
            iconToolbar: AddColumnIcon,
            iconContextMenu: PlusIcon,
            titleToolbar: 'Insert',
            titleContextMenu: 'Insert Column Right',
            longTitle: 'Insert column to the Right',
            actionFunction: async () => {
                if (sheetDataArray.length === 0) {
                    return;
                }

                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                const newColumnHeader = 'new-column-' + getNewColumnHeader()
                // The new column should be placed 1 position to the right of the last selected column
                const selection = gridState.selections[gridState.selections.length - 1];
                const newColumnHeaderIndex = Math.max(selection.startingColumnIndex, selection.endingColumnIndex) + 1;

                await mitoAPI.editAddColumn(
                    sheetIndex,
                    newColumnHeader,
                    newColumnHeaderIndex
                )

                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: [{
                            sheetIndex: sheetIndex,
                            startingRowIndex: -1,
                            startingColumnIndex: newColumnHeaderIndex,
                            endingRowIndex: -1,
                            endingColumnIndex: newColumnHeaderIndex
                        }]
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to add columns to. Import data.'},
            searchTerms: ['add column', 'add col', 'new column', 'new col', 'insert column', 'insert col'],
            tooltip: "Add a new formula column to the right of your selection."
        },
        [ActionEnum.Add_Column_Left]: {
            type: 'build-time',
            staticType: ActionEnum.Add_Column_Left,
            iconToolbar: AddColumnIcon,
            iconContextMenu: PlusIcon,
            titleToolbar: 'Insert',
            longTitle: 'Insert Column to the Left',
            titleContextMenu: 'Insert Column Left',
            actionFunction: async () => {
                if (sheetDataArray.length === 0) {
                    return;
                }

                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                const newColumnHeader = 'new-column-' + getNewColumnHeader()
                // The new column should be placed 1 position to the left of the first selected column
                const selection = gridState.selections[gridState.selections.length - 1];
                const newColumnHeaderIndex = Math.min(selection.startingColumnIndex, selection.endingColumnIndex);

                await mitoAPI.editAddColumn(
                    sheetIndex,
                    newColumnHeader,
                    newColumnHeaderIndex
                )

                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: [{
                            sheetIndex: sheetIndex,
                            startingRowIndex: -1,
                            startingColumnIndex: newColumnHeaderIndex,
                            endingRowIndex: -1,
                            endingColumnIndex: newColumnHeaderIndex
                        }]
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to add columns to. Import data.'},
            searchTerms: ['add column', 'add col', 'new column', 'new col', 'insert column', 'insert col'],
            tooltip: "Add a new formula column to the left of your selection."
        },
        [ActionEnum.AddChartElementDropdown]: {
            type: 'build-time',
            staticType: ActionEnum.AddChartElementDropdown,
            iconToolbar: AddChartElementIcon,
            titleToolbar: 'Add Chart Element',
            longTitle: 'Add Chart Element',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the graph taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'add-chart-element'
                    }
                });
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['add chart element', 'add chart', 'add element', 'add graph element', 'add graph', 'add element'],
            tooltip: "Add a new chart element to the graph."
        },
        [ActionEnum.ChangeChartTypeDropdown]: {
            type: 'build-time',
            staticType: ActionEnum.ChangeChartTypeDropdown,
            iconToolbar: GraphIcon,
            titleToolbar: 'Change Chart Type',
            longTitle: 'Change Chart Type',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the graph taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'change-chart-type'
                    }
                });
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['change chart type', 'change chart', 'change type', 'change graph type', 'change graph', 'change type'],
            tooltip: "Change the type of the graph."
        },
        [ActionEnum.Catch_Up]: {
            type: 'build-time',
            staticType: ActionEnum.Catch_Up,
            iconToolbar: CatchUpIcon,
            titleToolbar: 'Catch Up',
            longTitle: 'Catch up',
            actionFunction: () => {
                // Fast forwards to the most recent step, allowing editing
                void mitoAPI.log('click_catch_up')
                void mitoAPI.updateCheckoutStepByIndex(-1); // TODO: Check that -1 works! And below
            },
            isDisabled: () => {return analysisData.currStepIdx === lastStepSummary.step_idx ? 'You are on the most recent step, so there is nothing to catch up on.' : undefined},
            searchTerms: ['fast forward', 'catch up'],
            tooltip: "Go to the current state of the analysis."
        },
        [ActionEnum.Change_Dtype]: {
            type: 'build-time',
            staticType: ActionEnum.Change_Dtype,
            iconToolbar: DtypeIcon,
            titleToolbar: 'Dtype',
            longTitle: 'Change column dtype',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'dtype'
                    }
                })
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to change the dtype of. Import data.';
                } 

                return defaultActionDisabledMessage;
            },
            searchTerms: ['change dtype', 'dtype', 'cast', 'boolean', 'string', 'number', 'float', 'int', 'datetime', 'date', 'timedelta'],
            tooltip: "Cast the dtype of your data column to a string, int, float, boolean, datetime, or timedelta."
        },
        [ActionEnum.Clear]: {
            type: 'build-time',
            staticType: ActionEnum.Clear,
            iconToolbar: ClearIcon,
            longTitle: "Clear all edits",
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                // Close all taskpanes if they are open, to make sure the state is not out of sync
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.ClearAnalysis},
                        currOpenTaskpane: {type: TaskpaneType.NONE},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['clear', 'reset', 'undo', 'redo'],
            tooltip: "Removes all of the transformations you've made to imported dataframes."
        },
        [ActionEnum.Column_Summary]: {
            type: 'build-time',
            staticType: ActionEnum.Column_Summary,
            titleToolbar: 'Column Summary',
            titleContextMenu: 'Column Summary Stats',
            iconContextMenu: SummaryIcon,
            longTitle: 'View column summary statistics ',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                if (typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'context-menu') {
                    const rowIndex = uiState.currOpenDropdown.rowIndex;
                    const columnIndex = uiState.currOpenDropdown.columnIndex;
                    setGridState(prevGridState => {
                        return {
                            ...prevGridState,
                            selections: [{
                                sheetIndex: sheetIndex,
                                startingRowIndex: rowIndex,
                                startingColumnIndex: columnIndex,
                                endingRowIndex: rowIndex,
                                endingColumnIndex: columnIndex
                            }]
                        }
                    })
                }

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                        selectedColumnControlPanelTab: ControlPanelTab.SummaryStats,
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to summarize in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['column summary', 'describe', 'stats'],
            tooltip: "Learn about the distribution of the data in the selected column."
        },
        [ActionEnum.Copy]: {
            type: 'build-time',
            staticType: ActionEnum.Copy,
            iconToolbar: CopyIcon,
            iconContextMenu: CopyContextMenuIcon,
            titleToolbar: 'Copy',
            longTitle: 'Copy',
            actionFunction: () => {
                closeOpenEditingPopups();

                const copyStringAndSelections = getCopyStringForClipboard(
                    sheetData,
                    gridState.selections
                );

                if (copyStringAndSelections === undefined) {
                    return;
                }

                const [stringToCopy, copiedSelections] = copyStringAndSelections;
                
                void writeTextToClipboard(stringToCopy);

                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        copiedSelections: copiedSelections
                    }
                })

                void mitoAPI.log('copied_data', {
                    'num_selections': gridState.selections.length
                });
            },
            isDisabled: () => {
                return getDataframeIsSelected(uiState, sheetDataArray) ? defaultActionDisabledMessage : "There is no selected data to copy."
            },
            searchTerms: ['copy', 'paste', 'export'],
            tooltip: "Copy the current selection to the clipboard."
        },
        [ActionEnum.CopyCode]: {
            type: 'build-time',
            staticType: ActionEnum.CopyCode,
            iconToolbar: CopyIcon,
            titleToolbar: 'Copy Code',
            longTitle: 'Copy Code to Clipboard',
            actionFunction: () => {
                closeOpenEditingPopups();

                const codeToCopy = getCodeString(
                    analysisData.analysisName,
                    analysisData.code,
                    userProfile.telemetryEnabled,
                    analysisData.publicInterfaceVersion
                )

                void writeTextToClipboard(codeToCopy);
            },
            isDisabled: () => {
                if (!analysisData.code || analysisData.code.length === 0) {
                    return 'There is no code to copy.';
                }
                return getDefaultActionsDisabledMessage(uiState, sendFunctionStatus);
            },
            searchTerms: ['copy', 'paste', 'export'],
            tooltip: "Copy the generated code to the clipboard.",
        },
        [ActionEnum.Delete]: {
            type: 'build-time',
            staticType: ActionEnum.Delete,
            iconToolbar: DeleteColumnIcon,
            iconContextMenu: TrashIcon,
            titleToolbar: 'Delete',
            titleContextMenu: 'Delete Column',
            longTitle: 'Delete column / row',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                const rowsToDelete = getSelectedRowLabelsWithEntireSelectedRow(gridState.selections, sheetData);
                if (rowsToDelete.length > 0) {
                    void mitoAPI.editDeleteRow(sheetIndex, rowsToDelete);
                }

                if (isSelectionsOnlyColumnHeaders(gridState.selections)) {
                    const columnIndexesSelected = getColumnIndexesInSelections(gridState.selections);
                    const columnIDsToDelete = columnIndexesSelected.map(colIdx => sheetData?.data[colIdx]?.columnID || '').filter(columnID => columnID !== '')

                    if (columnIDsToDelete !== undefined) {
                        await mitoAPI.editDeleteColumn(
                            sheetIndex,
                            columnIDsToDelete
                        )
                    }
                } 
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns or rows to delete. Import data.';
                }

                const rowsToDelete = getSelectedRowLabelsWithEntireSelectedRow(gridState.selections, sheetData);
                if (rowsToDelete.length > 0) {
                    return defaultActionDisabledMessage;
                }

                if (doesColumnExist(startingColumnID, sheetIndex, sheetDataArray)) {
                    if (isSelectionsOnlyColumnHeaders(gridState.selections)) {
                        return defaultActionDisabledMessage
                    } else {
                        return "The selection contains individual cells. Click on column headers to select entire columns only."
                    }
                } else {
                    return "There are no rows or columns in the dataframe to delete. Add data to the sheet."
                }
            },
            searchTerms: ['delete column', 'delete col', 'del col', 'del column', 'remove column', 'remove col',  'delete row', 'filter rows', 'rows', 'remove rows', 'hide rows'],
            tooltip: "Delete all of the selected columns or rows from the sheet."
        },
        [ActionEnum.Delete_Row]: {
            type: 'build-time',
            staticType: ActionEnum.Delete_Row,
            iconContextMenu: TrashIcon,
            titleContextMenu: 'Delete Row',
            longTitle: 'Delete row',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                const rowsToDelete = getSelectedRowLabelsInSingleSelection(gridState.selections[0], sheetData);
                if (rowsToDelete.length > 0) {
                    void mitoAPI.editDeleteRow(sheetIndex, rowsToDelete);
                }
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no rows to delete. Import data.';
                }

                const rowsToDelete = getSelectedRowLabelsInSingleSelection(gridState.selections[0], sheetData);
                if (rowsToDelete.length > 0) {
                    return defaultActionDisabledMessage;
                } else {
                    return 'There are no rows selected.'
                }
            },
            searchTerms: ['delete row', 'delete row', 'del row', 'remove row', 'filter rows', 'rows', 'remove rows', 'hide rows'],
            tooltip: "Delete the row of the selected cell."
        },
        [ActionEnum.Delete_Col]: {
            type: 'build-time',
            staticType: ActionEnum.Delete_Col,
            iconContextMenu: TrashIcon,
            titleContextMenu: 'Delete Column',
            longTitle: 'Delete column',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                const columnIndexesSelected = getColumnIndexesInSelections(gridState.selections);
                const columnIDsToDelete = columnIndexesSelected.map(colIdx => sheetData?.data[colIdx]?.columnID || '').filter(columnID => columnID !== '')

                if (columnIDsToDelete !== undefined) {
                    await mitoAPI.editDeleteColumn(
                        sheetIndex,
                        columnIDsToDelete
                    )
                }
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to delete. Import data.';
                }
                
                if (doesColumnExist(startingColumnID, sheetIndex, sheetDataArray)) {
                    return defaultActionDisabledMessage
                } else {
                    return "There are no columns in the dataframe to delete. Add data to the sheet."
                }
            },
            searchTerms: ['delete column', 'delete col', 'del col', 'del column', 'remove column', 'remove col'],
            tooltip: "Delete the column of the selected cell."
        },
        [ActionEnum.Delete_Dataframe]: {
            type: 'build-time',
            staticType: ActionEnum.Delete_Dataframe,
            titleToolbar: 'Delete dataframe',
            longTitle: 'Delete dataframe',
            actionFunction: async () => {
                // If the sheetIndex is not 0, decrement it.
                if (sheetIndex !== 0) {
                    setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            selectedSheetIndex: sheetIndex - 1
                        }
                    })
                }

                // Close 
                closeOpenEditingPopups();

                await mitoAPI.editDataframeDelete(sheetIndex)

            },
            isDisabled: () => {
                return getDataframeIsSelected(uiState, sheetDataArray) ? defaultActionDisabledMessage : "There is no selected dataframe to delete."
            },
            searchTerms: ['delete', 'delete dataframe', 'delete sheet', 'del', 'del dataframe', 'del sheet', 'remove', 'remove dataframe', 'remove sheet'],
            tooltip: "Delete the selected sheet."
        },
        [ActionEnum.Delete_Graph]: {
            type: 'build-time',
            staticType: ActionEnum.Delete_Graph,
            titleToolbar: 'Delete Graph',
            longTitle: 'Delete graph',
            actionFunction: async () => {
                const selectedGraphID = uiState.currOpenTaskpane.type === TaskpaneType.GRAPH ? uiState.currOpenTaskpane.openGraph.graphID : undefined;
                if (selectedGraphID) {
                    await deleteGraphs([selectedGraphID], mitoAPI, setUIState, analysisData.graphDataArray);
                }
            },
            isDisabled: () => {
                return getAnyGraphIsSelected(uiState) ? defaultActionDisabledMessage : "There is no selected graph to delete."
            },
            searchTerms: ['delete', 'delete graph', 'delete chart', 'del', 'del chart', 'del chart', 'remove', 'remove chart', 'remove graph'],
            tooltip: "Delete the selected graph."
        },
        [ActionEnum.Docs]: {
            type: 'build-time',
            staticType: ActionEnum.Docs,
            titleToolbar: 'Docs',
            longTitle: 'Documentation',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We log the opening of the documentation taskpane
                void mitoAPI.log('clicked_documentation');

                // Open the documentation in a new tab - to importing because they have mito
                // installed already
                window.open('https://docs.trymito.io/how-to/importing-data-to-mito', '_blank')
            },
            isDisabled: () => {return undefined},
            searchTerms: ['docs', 'documentation', 'help', 'support'],
            tooltip: "Documentation, tutorials, and how-tos on all functionality in Mito."
        },
        [ActionEnum.Drop_Duplicates]: {
            type: 'build-time',
            staticType: ActionEnum.Drop_Duplicates,
            iconToolbar: RemoveDuplicatesIcon,
            titleToolbar: 'Remove Duplicates',
            longTitle: 'Deduplicate dataframe',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the merge taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.DROP_DUPLICATES},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : "There are no dataframes to operate on. Import data."
            },
            searchTerms: ['dedup', 'deduplicate', 'same', 'remove', 'drop duplicates', 'duplicates'],
            tooltip: "Remove duplicated rows from your dataframe."
        },
        [ActionEnum.Duplicate_Dataframe]: {
            type: 'build-time',
            staticType: ActionEnum.Duplicate_Dataframe,
            titleToolbar: 'Duplicate Dataframe',
            longTitle: 'Duplicate dataframe',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                await mitoAPI.editDataframeDuplicate(sheetIndex)
            },
            isDisabled: () => {
                return getDataframeIsSelected(uiState, sheetDataArray) ? defaultActionDisabledMessage : 'There is no selected dataframe to duplicate.'
            },
            searchTerms: ['duplicate', 'copy'],
            tooltip: "Make a copy of the selected sheet."
        },
        [ActionEnum.Export]: {
            type: 'build-time',
            staticType: ActionEnum.Export,
            iconToolbar: ExportIcon,
            titleToolbar: 'Download',
            longTitle: 'Download File Now',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We close the editing taskpane if its open
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.DOWNLOAD},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to export. Import data.'
            },
            searchTerms: ['export', 'download', 'excel', 'csv'],
            tooltip: "Download dataframes as a .csv or .xlsx file."
        },
        [ActionEnum.Export_Dropdown]: {
            type: 'build-time',
            staticType: ActionEnum.Export_Dropdown,
            iconToolbar: ExportIcon,
            titleToolbar: 'Export',
            longTitle: 'Open Export Dropdown',
            actionFunction: () => {
                setEditorState(undefined);
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'export'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to export. Import data.'
            },
            searchTerms: ['export', 'download', 'excel', 'csv'],
            tooltip: "Export dataframes as a .csv or .xlsx file. Choose whether or not to include export in the code."
        },
        [ActionEnum.Graph_SelectData]: {
            type: 'build-time',
            staticType: ActionEnum.Graph_SelectData,
            iconToolbar: SelectDataIcon,
            titleToolbar: 'Select Data',
            longTitle: 'Select Data',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                const currOpenTaskpane = uiState.currOpenTaskpane;
                if (currOpenTaskpane.type === TaskpaneType.GRAPH) {
                    // Open the graph taskpane
                    setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {
                                ...currOpenTaskpane,
                                graphSidebarOpen: true,
                            }
                        }
                    });
                }
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['select data', 'select'],
            tooltip: "Select the data to be used in the graph."
        },
        [ActionEnum.ExportGraphDropdown]: {
            type: 'build-time',
            staticType: ActionEnum.ExportGraphDropdown,
            iconToolbar: ExportIcon,
            titleToolbar: 'Export',
            longTitle: 'Open Export Dropdown',
            actionFunction: () => {
                setEditorState(undefined);
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'export-graph'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to export. Import data.'
            },
            searchTerms: ['export', 'download', 'excel', 'csv'],
            tooltip: "Export dataframes as a .csv or .xlsx file. Choose whether or not to include export in the code."
        },
        [ActionEnum.Fill_Na]: {
            type: 'build-time',
            staticType: ActionEnum.Fill_Na,
            iconToolbar: FillNanIcon,
            titleToolbar: 'Fill Missing Values',
            longTitle: 'Fill NaN Values',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                const selectedColumnIDs = getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData);
                
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {
                            type: TaskpaneType.FILL_NA,
                            startingColumnIDs: selectedColumnIDs
                        },
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There is no dataframe to fill nan values within.'
            },
            searchTerms: ['fill nan', 'nan', 'find', 'replace', 'null', 'undefined', 'fill null', 'fill undefined', 'empty', 'none', 'blank'],
            tooltip: "Fill all NaN values within a dataframe or list of columns."
        },
        [ActionEnum.Filter]: {
            type: 'build-time',
            staticType: ActionEnum.Filter,
            iconToolbar: FilterIcon,
            titleToolbar: 'Filter',
            longTitle: 'Filter column',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                if (typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'context-menu') {
                    const rowIndex = uiState.currOpenDropdown.rowIndex;
                    const columnIndex = uiState.currOpenDropdown.columnIndex;
                    setGridState(prevGridState => {
                        return {
                            ...prevGridState,
                            selections: [{
                                sheetIndex: sheetIndex,
                                startingRowIndex: rowIndex,
                                startingColumnIndex: columnIndex,
                                endingRowIndex: rowIndex,
                                endingColumnIndex: columnIndex
                            }]
                        }
                    })
                }

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                        selectedColumnControlPanelTab: ControlPanelTab.FilterSort,
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to filter in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['filter', 'remove', 'delete'],
            tooltip: "Filter this dataframe based on the data in a column."
        },

        [ActionEnum.FilterToCellValue]: {
            type: 'build-time',
            staticType: ActionEnum.FilterToCellValue,
            titleContextMenu: 'Filter to Cell Value',
            iconContextMenu: FilterIcon,
            longTitle: 'Filter column',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                if (columnID !== undefined) {
                    const condition = getEqualityFilterCondition(cellValue, columnDtype);
                    await mitoAPI.editFilter(
                        sheetIndex,
                        columnID,
                        [
                            {
                                condition: condition,
                                value: cellValue
                            } as FilterType
                        ],
                        'And',
                        ControlPanelTab.FilterSort,
                        getRandomId()
                    );
                }
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to filter in the selected sheet. Import data.'
                }
                if (gridState.selections.length === 1 &&
                    gridState.selections[0].startingRowIndex === gridState.selections[0].endingRowIndex &&
                    gridState.selections[0].startingColumnIndex === gridState.selections[0].endingColumnIndex) {
                    return defaultActionDisabledMessage;
                } else {
                    return 'This action can only be applied to a single cell.'
                }
            },
            searchTerms: ['filter', 'remove', 'delete'],
            tooltip: "Filter this column to only show rows with the same value as the selected cell."
        },
        [ActionEnum.Format_Number_Columns]: {
            type: 'build-time',
            staticType: ActionEnum.Format_Number_Columns,
            titleToolbar: 'Number',
            longTitle: 'Format number columns',
            titleContextMenu: 'Format Number Column',
            iconContextMenu: NumberFormatIcon,
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We close editing taskpanes
                closeOpenEditingPopups()

                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'format'
                    }
                })
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['format', 'decimals', 'percent', '%', 'scientific', 'Mill', 'Bill', 'round'],
            tooltip: "Format all of the selected columns as percents, choose the number of decimals, etc. This only changes the display of the data, and does not effect the underlying dataframe."
        },
        [ActionEnum.Formulas_Dropdown_Math]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_Math,
            iconToolbar: MathFunctionsIcon,
            longTitle: 'Math Formulas',
            titleToolbar: 'Math',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-math'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['math', 'functions'],
            tooltip: "Perform math on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_Logic]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_Logic,
            iconToolbar: LogicalFunctionsIcon,
            longTitle: 'Logic Formulas',
            titleToolbar: 'Logical',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-logic'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['logic', 'functions'],
            tooltip: "Perform logic on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_Text]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_Text,
            iconToolbar: TextFunctionsIcon,
            longTitle: 'Text Formulas',
            titleToolbar: 'Text',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-text'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['text', 'functions'],
            tooltip: "Perform text operations on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_DateTime]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_DateTime,
            iconToolbar: DateTimeFunctionsIcon,
            longTitle: 'Date and Time Formulas',
            titleToolbar: 'Date & Time',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-date'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['date', 'time', 'datetime', 'functions'],
            tooltip: "Perform date / time operations on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_Reference]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_Reference,
            iconToolbar: LookupFunctionsIcon,
            longTitle: 'Lookup & Reference Formulas',
            titleToolbar: 'Lookup & Reference',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-reference'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['reference', 'lookup', 'functions'],
            tooltip: "Perform lookups on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_Custom]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_Custom,
            iconToolbar: LookupFunctionsIcon,
            longTitle: 'Custom Formulas',
            titleToolbar: 'Custom',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-custom'
                    }
                })
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to perform custom functions on. Import data.'
                } else if (analysisData.userDefinedFunctions.length === 0) {
                    return 'There are no custom formulas available.'
                } else {
                    return defaultActionDisabledMessage;
                }
            },
            searchTerms: ['custom', 'functions'],
            tooltip: "Perform custom functions on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_Finance]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_Finance,
            iconToolbar: FinancialFunctionsIcon,
            longTitle: 'Finance Formulas',
            titleToolbar: 'Finance',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-finance'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['financial', 'finance', 'functions'],
            tooltip: "Perform finance operations on the selected columns."
        },
        [ActionEnum.Formulas_Dropdown_More]: {
            type: 'build-time',
            staticType: ActionEnum.Formulas_Dropdown_More,
            iconToolbar: MoreFunctionsIcon,
            longTitle: 'More Formulas',
            titleToolbar: 'More',
            actionFunction: () => {
                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'formula-more'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to perform math on. Import data.'
            },
            searchTerms: ['formulas', 'functions'],
            tooltip: "Add formulas to the selected columns."
        },
        [ActionEnum.Set_Format_Default]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Format_Default,
            longTitle: 'Format as default',
            actionFunction: () => {
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                void changeFormatOfColumns(sheetIndex, sheetData, selectedNumberSeriesColumnIDs, { type: NumberColumnFormatEnum.PLAIN_TEXT }, mitoAPI)
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['plain', 'default', 'number format', 'format'],
            tooltip: 'Format all of the selected columns as default (plain text). This only changes the display of the data, and does not effect the underlying dataframe.'
        },
        [ActionEnum.Set_Format_Number]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Format_Number,
            longTitle: 'Format as number (two decimal places)',
            actionFunction: () => {
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                void changeFormatOfColumns(sheetIndex, sheetData, selectedNumberSeriesColumnIDs, { precision: 2 }, mitoAPI)
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['accounting', 'number', 'number format', 'format'],
            tooltip: 'Format all of the selected columns as number with two decimal places. This only changes the display of the data, and does not effect the underlying dataframe.'
        },
        [ActionEnum.Set_Format_Scientific]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Format_Scientific,
            longTitle: 'Format as scientific notation',
            actionFunction: () => {
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                void changeFormatOfColumns(sheetIndex, sheetData, selectedNumberSeriesColumnIDs, { type: NumberColumnFormatEnum.SCIENTIFIC_NOTATION }, mitoAPI)
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['scientific notation', 'number format', 'format'],
            tooltip: 'Format all of the selected columns as scientific notation. This only changes the display of the data, and does not effect the underlying dataframe.'
        },
        [ActionEnum.Set_Format_Currency]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Format_Currency,
            iconToolbar: CurrencyIcon,
            longTitle: 'Format as currency',
            actionFunction: () => {
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                void changeFormatOfColumns(sheetIndex, sheetData, selectedNumberSeriesColumnIDs, { type: NumberColumnFormatEnum.CURRENCY }, mitoAPI)
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['currency', 'number format', 'format'],
            tooltip: 'Format all of the selected columns as currency. This only changes the display of the data, and does not effect the underlying dataframe.'
        },
        [ActionEnum.Set_Format_Percent]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Format_Percent,
            iconToolbar: PercentIcon,
            longTitle: 'Format as percentage',
            actionFunction: () => {
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                void changeFormatOfColumns(sheetIndex, sheetData, selectedNumberSeriesColumnIDs, { type: NumberColumnFormatEnum.PERCENTAGE }, mitoAPI)
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['percent', '%', 'number format', 'format'],
            tooltip: 'Format all of the selected columns as percentage. This only changes the display of the data, and does not effect the underlying dataframe.'
        },
        [ActionEnum.Set_DateTime_Dtype]: {
            type: 'build-time',
            staticType: ActionEnum.Set_DateTime_Dtype,
            longTitle: 'Set datetime type',
            actionFunction: () => {
                closeOpenEditingPopups();

                const columnIndexesSelected = getColumnIndexesInSelections(gridState.selections);
                const columnIDs = columnIndexesSelected
                    .filter(colIdx => sheetData.data.length > colIdx)
                    .map(colIdx => sheetData.data[colIdx]?.columnID)
                
                void mitoAPI.editChangeColumnDtype(sheetIndex, columnIDs, ColumnDtypes.DATETIME, getRandomId())
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                return defaultActionDisabledMessage;
            },
            searchTerms: ['datetime', 'dtype'],
            tooltip: 'Set datatype of all of the selected columns to datetime.'
        },
        [ActionEnum.Fullscreen]: {
            type: 'build-time',
            staticType: ActionEnum.Fullscreen,
            longTitle: 'Toggle fullscreen',
            actionFunction: () => {
                // We toggle to the opposite of whatever the fullscreen actually is (as detected by the
                // fscreen library), and then we set the fullscreen state variable to that state (in the callback
                // above), so that the component rerenders propery
                const isNotFullscreen = fscreen.fullscreenElement === undefined || fscreen.fullscreenElement === null;
                if (isNotFullscreen && mitoContainerRef.current) {
                    fscreen.requestFullscreen(mitoContainerRef.current);
                } else {
                    fscreen.exitFullscreen();
                }

                void mitoAPI.log(
                    'button_toggle_fullscreen',
                    {
                        // Note that this is true when _end_ in fullscreen mode, and 
                        // false when we _end_ not in fullscreen mode, which is much
                        // more natural than the alternative
                        fullscreen: !!fscreen.fullscreenElement
                    }
                )
            },
            isDisabled: () => {return undefined},
            searchTerms: ['fullscreen', 'zoom'],
            tooltip: "Enter fullscreen mode to see more of your data."
        },
        [ActionEnum.Graph]: {
            type: 'build-time',
            staticType: ActionEnum.Graph,
            iconToolbar: GraphIcon,
            titleToolbar: 'Graph',
            longTitle: 'Create new graph',
            actionFunction: async () => {
                const selectedColumnIds = getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData);
                await openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {type: 'new_graph', graphType: GraphType.BAR, selectedColumnIds: selectedColumnIds});
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to graph. Import data.'},
            searchTerms: ['graph', 'chart', 'visualize', 'bar chart', 'box plot', 'scatter plot', 'histogram'],
            tooltip: "Create an interactive graph. Pick from bar charts, histograms, scatter plots, etc."
        },
        [ActionEnum.Graph_Bar]: {
            type: 'build-time',
            staticType: ActionEnum.Graph_Bar,
            iconToolbar: GraphIcon,
            longTitle: 'Create new bar chart',
            actionFunction: async () => {
                const selectedColumnIds = getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData);
                await openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {type: 'new_graph', graphType: GraphType.BAR, selectedColumnIds: selectedColumnIds});
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to graph. Import data.'},
            searchTerms: ['graph', 'chart', 'visualize', 'bar chart', 'box plot', 'scatter plot', 'histogram'],
            tooltip: "Create an interactive bar chart."
        },
        [ActionEnum.Graph_Line]: {
            type: 'build-time',
            staticType: ActionEnum.Graph_Line,
            iconToolbar: LineChartIcon,
            longTitle: 'Create new line graph',
            actionFunction: async () => {
                const selectedColumnIds = getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData);
                await openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {type: 'new_graph', graphType: GraphType.LINE, selectedColumnIds: selectedColumnIds});
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to graph. Import data.'},
            searchTerms: ['graph', 'chart', 'visualize', 'bar chart', 'box plot', 'scatter plot', 'histogram'],
            tooltip: "Create an interactive line graph."
        },
        [ActionEnum.Graph_Scatter]: {
            type: 'build-time',
            staticType: ActionEnum.Graph_Scatter,
            iconToolbar: ScatterPlotIcon,
            longTitle: 'Create new scatter plot',
            actionFunction: async () => {
                const selectedColumnIds = getSelectedColumnIDsWithEntireSelectedColumn(gridState.selections, sheetData);
                await openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {type: 'new_graph', graphType: GraphType.SCATTER, selectedColumnIds: selectedColumnIds});
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no dataframes to graph. Import data.'},
            searchTerms: ['graph', 'chart', 'visualize', 'bar chart', 'box plot', 'scatter plot', 'histogram'],
            tooltip: "Create an interactive scatter plot."
        },
        [ActionEnum.Help]: {
            type: 'build-time',
            staticType: ActionEnum.Help,
            titleToolbar: 'Help',
            longTitle: 'Help',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // Open Discord
                if (userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL === DEFAULT_SUPPORT_EMAIL) {
                    window.open(DISCORD_INVITE_LINK, '_blank')
                } else {
                    window.open(`mailto:${userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL}?subject=Mito support request`)
                }
                
            },
            isDisabled: () => {return undefined},
            searchTerms: ['help', 'contact', 'support', 'slack', 'discord'],
            tooltip: "Join our Discord for more help."
        },
        [ActionEnum.Import_Dropdown]: {
            type: 'build-time',
            staticType: ActionEnum.Import_Dropdown,
            iconToolbar: ImportIcon,
            titleToolbar: 'Import',
            longTitle: 'Open import dropdown',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'import'
                    }
                })
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['import', 'upload', 'new', 'excel', 'csv', 'add'],
            tooltip: "Import a new sheet from .csv or .xlsx files, dataframe objects, or through Snowflake."
        },
        [ActionEnum.Import_Files]: {
            type: 'build-time',
            staticType: ActionEnum.Import_Files,
            titleToolbar: 'Import Files',
            iconToolbar: FileImportIcon,
            longTitle: 'Import files',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.IMPORT_FILES},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['import', 'upload', 'new', 'excel', 'csv', 'add'],
            tooltip: "Import any .csv or well-formatted .xlsx file as a new sheet."
        },
        [ActionEnum.Merge]: {
            type: 'build-time',
            staticType: ActionEnum.Merge,
            iconToolbar: MergeIcon,
            titleToolbar: 'Merge',
            longTitle: 'Merge dataframes',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the merge taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.MERGE},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return sheetDataArray.length >= 2 ? defaultActionDisabledMessage : 'You need to import at least two dataframes before you can merge them.'},
            searchTerms: ['merge', 'join', 'vlookup', 'lookup', 'anti', 'diff', 'difference', 'unique'],
            tooltip: "Merge two dataframes together using a lookup, left, right, inner, or outer join. Or find the differences between two dataframes."
        },
        [ActionEnum.Merge_Dropdown]: {
            type: 'build-time',
            staticType: ActionEnum.Merge_Dropdown,
            iconToolbar: MergeIcon,
            titleToolbar: 'Merge',
            longTitle: 'Merge dataframes',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the merge taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'merge',
                    }
                })
            },
            isDisabled: () => {return sheetDataArray.length >= 2 ? defaultActionDisabledMessage : 'You need to import at least two dataframes before you can merge them.'},
            searchTerms: ['merge', 'join', 'vlookup', 'lookup', 'anti', 'diff', 'difference', 'unique'],
            tooltip: "Merge two dataframes together using a lookup, left, right, inner, or outer join. Or find the differences between two dataframes."
        },
        [ActionEnum.AntiMerge]: {
            type: 'build-time',
            staticType: ActionEnum.AntiMerge,
            iconToolbar: AntiMergeIcon,
            titleToolbar: 'Anti-Merge',
            longTitle: 'Merge dataframes unique in left',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the merge taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.MERGE, defaultMergeType: MergeType.UNIQUE_IN_LEFT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return sheetDataArray.length >= 2 ? defaultActionDisabledMessage : 'You need to import at least two dataframes before you can merge them.'},
            searchTerms: ['merge', 'join', 'vlookup', 'lookup', 'anti', 'diff', 'difference', 'unique'],
            tooltip: "Merge two dataframes by including each row from the first sheet that doesn't have a match in the second sheet."
        },
        [ActionEnum.Concat_Dataframes]: {
            type: 'build-time',
            staticType: ActionEnum.Concat_Dataframes,
            iconToolbar: ConcatIcon,
            titleToolbar: 'Concat',
            longTitle: 'Concatenate dataframes',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We open the merge taskpane
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.CONCAT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return sheetDataArray.length >= 2 ? defaultActionDisabledMessage : 'You need to import at least two dataframes before you can concatenate them.'},
            searchTerms: ['stack', 'merge', 'join', 'concat', 'concatenate', 'append'],
            tooltip: "Concatenate two or more dataframes by stacking them vertically on top of eachother."
        },
        [ActionEnum.Pivot]: {
            type: 'build-time',
            staticType: ActionEnum.Pivot,
            iconToolbar: PivotIcon,
            titleToolbar: 'Pivot',
            longTitle: 'Pivot table',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
                
                // We check if the currently opened sheet is a result of a pivot table
                // and if so then we open the existing pivot table here, rather than
                // create a new pivot table. That is: if a user is on a pivot table, then
                // we let them edit that pivot table
                if (dfSources[sheetIndex] === DFSource.Pivoted) {
                    const response = await mitoAPI.getPivotParams(sheetIndex);
                    const existingPivotParams = 'error' in response ? undefined : response.result;
                    if (existingPivotParams !== undefined) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenModal: {type: ModalEnum.None},
                                currOpenTaskpane: {
                                    type: TaskpaneType.PIVOT,
                                    sourceSheetIndex: existingPivotParams.sheet_index,
                                    destinationSheetIndex: sheetIndex,
                                    existingPivotParams: existingPivotParams
                                },
                                selectedTabType: 'data'
                            }
                        })

                        return;
                    } 
                } 
                /* 
                    This case just opens a new pivot table. 
                    
                    BUG: when the user has a pivot table, and deletes a dataframe
                    before it, we enter this case, as the df source of the pivot 
                    table is Pivoted, but the sheet index used to get the pivot
                    params is out of date.

                    In this case, we don't edit the pivot table, but rather open a
                    new one.

                    The fix for this bug is moving from sheet index -> sheet id, as
                    we did with column header ids!
                */
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {
                            type: TaskpaneType.PIVOT,
                            sourceSheetIndex: sheetIndex,
                            destinationSheetIndex: undefined,
                            existingPivotParams: undefined
                        },
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no sheets to pivot. Import data.'},
            searchTerms: ['pivot', 'group', 'group by', 'summarize', 'aggregate'],
            tooltip: "Create a Pivot Table to summarise data by breaking the data into groups and calculating statistics about each group."
        },
        [ActionEnum.Precision_Decrease]: {
            type: 'build-time',
            staticType: ActionEnum.Precision_Decrease,
            iconToolbar: LessIcon,
            longTitle: 'Decrease decimal places displayed',
            actionFunction: async () => {  
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                const newDfFormat: DataframeFormat = window.structuredClone(dfFormat);
                selectedNumberSeriesColumnIDs.forEach((columnID) => {
                    const columnDtype = sheetData.columnDtypeMap[columnID];
                    const newColumnFormat = decreasePrecision({...newDfFormat.columns[columnID]}, columnDtype)
                    newDfFormat.columns[columnID] = newColumnFormat;
                });

                void mitoAPI.editSetDataframeFormat(sheetIndex, newDfFormat);
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE;
            },
            searchTerms: ['format', 'round', 'decimal', 'decimal places', 'fraction'],
            tooltip: "Decrease the number of decimal places that are displayed in the selected number columns." 
        },
        [ActionEnum.Precision_Increase]: {
            type: 'build-time',
            staticType: ActionEnum.Precision_Increase,
            iconToolbar: MoreIcon,
            longTitle: 'Increase decimal places displayed',
            actionFunction: async () => {  
                closeOpenEditingPopups();

                const selectedNumberSeriesColumnIDs = getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData);
                const newDfFormat: DataframeFormat = window.structuredClone(dfFormat);
                selectedNumberSeriesColumnIDs.forEach((columnID) => {
                    const columnDtype = sheetData.columnDtypeMap[columnID];
                    const newColumnFormat = increasePrecision({...newDfFormat.columns[columnID]}, columnDtype)
                    newDfFormat.columns[columnID] = newColumnFormat;
                });
                void mitoAPI.editSetDataframeFormat(sheetIndex, newDfFormat);
            },
            isDisabled: () => {
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to format. Import data.'
                }
                
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? defaultActionDisabledMessage : FORMAT_DISABLED_MESSAGE;
            },
            searchTerms: ['format', 'round', 'decimal', 'decimal places', 'fraction'],
            tooltip: "Increase the number of decimal places that are displayed in the selected number columns." 
        },
        [ActionEnum.Promote_Row_To_Header]: {
            type: 'build-time',
            staticType: ActionEnum.Promote_Row_To_Header,
            titleToolbar: 'Promote to Header',
            iconContextMenu: PromoteToHeaderIcon,
            titleContextMenu: 'Promote Row to Header',
            longTitle: 'Promote Row to header',
            actionFunction: async () => {
                const rowsToPromote = getSelectedRowLabelsWithEntireSelectedRow(gridState.selections, sheetData);
                if (rowsToPromote.length > 0) {
                    void mitoAPI.editPromoteRowToHeader(sheetIndex, rowsToPromote[0]);
                }
            },
            isDisabled: () => {
                const rowsToDelete = getSelectedRowLabelsWithEntireSelectedRow(gridState.selections, sheetData);
                if (rowsToDelete.length > 0) {
                    return defaultActionDisabledMessage;
                }
                return "There is no selected row to promote to header."
            },
            searchTerms: ['make header', 'row to header', 'rename headers', 'column headers', 'promote row'],
            tooltip: "Promote the selected row to be the header of the dataframe, and delete it." 
        },
        [ActionEnum.Redo]: {
            type: 'build-time',
            staticType: ActionEnum.Redo,
            iconToolbar: RedoIcon,
            longTitle: 'Redo',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We close the editing taskpane if its open
                closeOpenEditingPopups(ALLOW_UNDO_REDO_EDITING_TASKPANES);
    
                void mitoAPI.updateRedo();
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['redo', 'undo'],
            tooltip: "Reapplies the last step that you undid, as long as you haven't made any edits since the undo."
        },
        [ActionEnum.Rename_Column]: {
            type: 'build-time',
            staticType: ActionEnum.Rename_Column,
            titleToolbar: 'Rename Column',
            titleContextMenu: 'Rename',
            iconContextMenu: EditIcon,
            longTitle: 'Rename column',
            actionFunction: () => {
                let columnIndex = startingColumnIndex;
                // If this is being triggered by a context menu, then we need to find the column that was clicked on
                if (typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'context-menu') {
                    columnIndex = uiState.currOpenDropdown.columnIndex;
                }
                const columnHeader = getCellDataFromCellIndexes(sheetData, -1, columnIndex).columnHeader;

                // Get the pieces of the column header. If the column header is not a MultiIndex header, then
                // lowerLevelColumnHeaders will be an empty array
                const columnHeaderSafe = columnHeader !== undefined ? columnHeader : ''
                const finalColumnHeader = getColumnHeaderParts(columnHeaderSafe).finalColumnHeader

                setEditorState({
                    rowIndex: -1,
                    columnIndex: columnIndex,
                    formula: getDisplayColumnHeader(finalColumnHeader),
                    editorLocation: 'cell',
                    editingMode: 'specific_index_labels',
                    sheetIndex: sheetIndex
                })

            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns in the dataframe to rename. Add data to the dataframe.'
            },
            searchTerms: ['rename', 'name', 'header'],
            tooltip: "Rename the selected column."
        },
        [ActionEnum.Rename_Dataframe]: {
            type: 'build-time',
            staticType: ActionEnum.Rename_Dataframe,
            titleToolbar: 'Rename dataframe',
            longTitle: 'Rename dataframe',
            actionFunction: () => {
                // Use a query selector to get the div and then double click on it
                const selectedSheetTab = mitoContainerRef.current?.querySelector('.tab-selected') as HTMLDivElement | null;
                if (selectedSheetTab) {
                    const event = new MouseEvent('dblclick', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                    selectedSheetTab.dispatchEvent(event);
                }
            },
            isDisabled: () => {
                // We check if any sheet exists, instead of the specific sheet because this event is often accessed
                // very closely in time with switching the sheet indexes via double clicking. 
                return getDataframeIsSelected(uiState, sheetDataArray) ? defaultActionDisabledMessage : 'There is no selected dataframe to rename.'
            },
            searchTerms: ['rename', 'name'],
            tooltip: "Rename the selected sheet."
        },
        [ActionEnum.Rename_Graph]: {
            type: 'build-time',
            staticType: ActionEnum.Rename_Graph,
            titleToolbar: 'Rename Graph',
            longTitle: 'Rename graph',
            actionFunction: () => {
                // Use a query selector to get the div and then double click on it
                const selectedSheetTab = mitoContainerRef.current?.querySelector('.tab-selected') as HTMLDivElement | null;
                if (selectedSheetTab) {
                    const event = new MouseEvent('dblclick', {
                        'view': window,
                        'bubbles': true,
                        'cancelable': true
                    });
                    selectedSheetTab.dispatchEvent(event);
                }
            },
            isDisabled: () => {
                return getAnyGraphIsSelected(uiState) ? defaultActionDisabledMessage : 'There is not selected graph to rename.'
            },
            searchTerms: ['rename', 'name', 'graph'],
            tooltip: "Rename the selected graph."
        },
        [ActionEnum.Schedule_Github]: {
            type: 'build-time',
            staticType: ActionEnum.Schedule_Github,
            titleToolbar: 'Schedule Automation',
            iconToolbar: ScheduleIcon,
            longTitle: 'Schedule Automation',
            actionFunction: () => {
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.GITHUB_SCHEDULE},
                        selectedTabType: 'data'
                    }
                })
                
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'Please import and edit data before scheduling an automation.'},
            searchTerms: ['github', 'pull request', 'automation', 'schedule'],
            tooltip: "Create a GitHub pull request that schedules this analysis to run at a specific time."
        },
        [ActionEnum.See_All_Functionality]: {
            type: 'build-time',
            staticType: ActionEnum.See_All_Functionality,
            titleToolbar: 'See All Functionality',
            longTitle: 'See all functionality',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We log the opening of the documentation taskpane
                void mitoAPI.log('clicked_documentation');

                // Open the documentation in a new tab - to importing because they have mito
                // installed already
                window.open('https://docs.trymito.io/how-to/importing-data-to-mito', '_blank')
            },
            isDisabled: () => {return undefined},
            searchTerms: ['docs', 'documentation', 'help', 'support'],
            tooltip: "Documentation, tutorials, and how-tos on all functionality in Mito."
        },
        [ActionEnum.Select_Columns]: {
            type: 'build-time',
            staticType: ActionEnum.Select_Columns,
            longTitle: 'Select column',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We close the editing taskpane if its open
                closeOpenEditingPopups();

                const minColumnIndex = Math.min(gridState.selections[0].startingColumnIndex, gridState.selections[0].endingColumnIndex);
                const maxColumnIndex = Math.max(gridState.selections[0].startingColumnIndex, gridState.selections[0].endingColumnIndex);
                const newStartingColumnIndex = Math.max(minColumnIndex, 0);
                const newEndingColumnIndex = Math.min(maxColumnIndex, sheetData.numColumns - 1);

                // Select the columns that are in the currently selected range. 
                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: [{
                            startingColumnIndex: newStartingColumnIndex,
                            endingColumnIndex: newEndingColumnIndex,
                            startingRowIndex: -1,
                            endingRowIndex: -1,
                            sheetIndex: sheetIndex
                        }]
                    }
                });
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to select. Import data.'},
            searchTerms: ['select', 'columns', 'select columns'],
            tooltip: "Select columns for all cells in currently selected range."
        },
        [ActionEnum.Select_Rows]: {
            type: 'build-time',
            staticType: ActionEnum.Select_Rows,
            longTitle: 'Select row',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We close the editing taskpane if its open
                closeOpenEditingPopups();

                const minRowIndex = Math.min(gridState.selections[0].startingRowIndex, gridState.selections[0].endingRowIndex);
                const maxRowIndex = Math.max(gridState.selections[0].startingRowIndex, gridState.selections[0].endingRowIndex);

                const newStartingRowIndex = Math.max(minRowIndex, 0);
                const newEndingRowIndex = Math.min(maxRowIndex, sheetData.numRows - 1);

                // Select the rows that are in the currently selected range
                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: [{
                            startingRowIndex: newStartingRowIndex,
                            endingRowIndex: newEndingRowIndex,
                            startingColumnIndex: -1,
                            endingColumnIndex: -1,
                            sheetIndex: sheetIndex
                        }]
                    }
                });
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no rows to select. Import data.'},
            searchTerms: ['select', 'rows', 'select rows'],
            tooltip: "Select rows for all cells in currently selected range."
        },
        [ActionEnum.Select_All]: {
            type: 'build-time',
            staticType: ActionEnum.Select_All,
            longTitle: 'Select all columns',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // We close the editing taskpane if its open
                closeOpenEditingPopups();

                // Select all columns
                setGridState(prevGridState => {
                    return {
                        ...prevGridState,
                        selections: [{
                            startingRowIndex: -1,
                            endingRowIndex: -1,
                            startingColumnIndex: 0,
                            endingColumnIndex: sheetData.numColumns - 1,
                            sheetIndex: sheetIndex
                        }]
                    }
                });
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no cells to select. Import data.'},
            searchTerms: ['select', 'cells', 'select all columns'],
            tooltip: "Select all data in current sheet."
        },
        [ActionEnum.Set_Cell_Value]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Cell_Value,
            titleToolbar: 'Set Cell Value',
            longTitle: 'Set cell value',
            actionFunction: async () => {
                if (startingColumnID === undefined) {
                    return 
                }

                closeOpenEditingPopups();

                setEditorState({
                    rowIndex: startingRowIndex,
                    columnIndex: startingColumnIndex,
                    formula: startingColumnFormula,
                    // Since you can't reference other cells while setting the value of a single cell, we default to scrolling in the formula
                    arrowKeysScrollInFormula: true,
                    editorLocation: 'cell',
                    editingMode: 'specific_index_labels',
                    sheetIndex: sheetIndex
                })
            },
            isDisabled: () => {
                if (!doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) || !doesSheetContainData(sheetIndex, sheetDataArray)) {
                    return 'There are no cells in the dataframe to set the value of. Add data to the sheet.'
                } 

                if (startingRowIndex === -1) {
                    return "An entire column is selected. Select a single cell to edit."
                }

                return defaultActionDisabledMessage
            },
            searchTerms: ['formula', 'function', 'edit', 'set', 'set formula', 'set column formula'],
            tooltip: "Update the value of a specific cell in a data column."
        },
        [ActionEnum.Set_Column_Formula]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Column_Formula,
            iconToolbar: FunctionIcon,
            titleToolbar: 'Insert Function',
            longTitle: 'Set column formula',
            actionFunction: async () => {  
                
                closeOpenEditingPopups();

                setEditorState({
                    rowIndex: startingRowIndex !== -1 ? startingRowIndex : 0,
                    columnIndex: startingColumnIndex,
                    formula: startingColumnFormula,
                    arrowKeysScrollInFormula: arrowKeysScrollInFormula,
                    editorLocation: 'cell',
                    editingMode: 'entire_column',
                    sheetIndex: sheetIndex
                })
            },
            isDisabled: () => {
                if (!doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) || !doesSheetContainData(sheetIndex, sheetDataArray)) {
                    // If there is no data in the sheet, then there is no cell editor to open!
                    return 'There are no cells in the dataframe to set the formula of. Add data to the sheet.'
                } 

                return defaultActionDisabledMessage;
            },
            searchTerms: ['formula', 'function', 'edit', 'set', 'set formula', 'set column formula'],
            tooltip: "Use one of Mito's spreadsheet formulas or basic math operators to set the column's values."
        },
        [ActionEnum.Sort]: {
            type: 'build-time',
            staticType: ActionEnum.Sort,
            iconToolbar: SortIcon,
            titleToolbar: 'Sort',
            longTitle: 'Sort column',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                        selectedColumnControlPanelTab: ControlPanelTab.FilterSort,
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to sort in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['sort', 'ascending', 'descending', 'arrange'],
            tooltip: "Sort a column in ascending or descending order."
        },
        [ActionEnum.SortAscending]: {
            type: 'build-time',
            staticType: ActionEnum.SortAscending,
            iconToolbar: SortAscendingIcon,
            titleContextMenu: 'Sort A to Z',
            longTitle: 'Sort column ascending',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
                if (startingColumnID === undefined) {
                    return 
                }

                let columnIndex = startingColumnIndex;
                if (typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'context-menu') {
                    columnIndex = uiState.currOpenDropdown.columnIndex;
                }
                const columnIDForSort = getColumnIDByIndex(sheetData, columnIndex);
                void mitoAPI.editSortColumn(sheetIndex, columnIDForSort, SortDirection.ASCENDING)
            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to sort in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['sort', 'ascending', 'arrange'],
            tooltip: "Sort a column in ascending order."
        },
        [ActionEnum.SortDescending]: {
            type: 'build-time',
            staticType: ActionEnum.SortDescending,
            iconToolbar: SortDescendingIcon,
            titleContextMenu: 'Sort Z to A',
            longTitle: 'Sort column descending',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                if (startingColumnID === undefined) {
                    return 
                }

                let columnIndex = startingColumnIndex;
                if (typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'context-menu') {
                    columnIndex = uiState.currOpenDropdown.columnIndex;
                }
                const columnIDForSort = getColumnIDByIndex(sheetData, columnIndex);
                void mitoAPI.editSortColumn(sheetIndex, columnIDForSort, SortDirection.DESCENDING)
            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns to sort in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['sort', 'descending', 'arrange'],
            tooltip: "Sort a column in descending order."
        },
        [ActionEnum.Split_Text_To_Column]: {
            type: 'build-time',
            staticType: ActionEnum.Split_Text_To_Column,
            iconToolbar: TextToColumnsIcon,
            titleToolbar: 'Text to Columns',
            longTitle: 'Split text to columns',
            actionFunction: () => {
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.SPLIT_TEXT_TO_COLUMNS, startingColumnID: startingColumnID}
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : "There are no dataframes to operate on. Import data."
            },
            searchTerms: ['split', 'extract', 'parse', 'column', 'splice', 'text', 'delimiter', 'comma', 'space', 'tab', 'dash'],
            tooltip: "Split a column on a delimiter to break it into multiple columns."
        },
        [ActionEnum.Steps]: {
            type: 'build-time',
            staticType: ActionEnum.Steps,
            longTitle: 'Step history',
            actionFunction: () => {
                void mitoAPI.log('click_open_steps')
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.STEPS},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['steps', 'history'],
            tooltip: "View a list of all the edits you've made to your data."
        },
        [ActionEnum.OpenFind]: {
            type: 'build-time',
            staticType: ActionEnum.OpenFind,
            iconToolbar: SearchIcon,
            longTitle: 'Find',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
                if (uiState.currOpenSearch.isOpen) {
                    const searchInput = mitoContainerRef.current?.querySelector<HTMLInputElement>('#mito-search-bar-input');
                    if (searchInput) {
                        // If the search bar is already open, then we focus on the input and select all
                        // to make it easier to search something new without removing the previous search
                        searchInput.focus();
                        searchInput.select();
                    }
                } else {
                    setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenSearch: { ...prevUIState.currOpenSearch, isOpen: true },
                        }
                    })
                }
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no sheets to pivot. Import data.'},
            searchTerms: ['search', 'find', 'filter', 'lookup'],
            tooltip: "Search for a value in your data.",
        },
        [ActionEnum.OpenFindAndReplace]: {
            type: 'build-time',
            staticType: ActionEnum.OpenFindAndReplace,
            longTitle: 'Find and Replace',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
                if (uiState.currOpenSearch.isOpen) {
                    const searchInput = mitoContainerRef.current?.querySelector<HTMLInputElement>('#mito-search-bar-input');
                    if (searchInput) {
                        // If the search bar is already open, then we focus on the input and select all
                        // to make it easier to search something new without removing the previous search
                        searchInput.focus();
                        searchInput.select();
                    }
                }
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenSearch: { ...prevUIState.currOpenSearch, isOpen: true, isExpanded: true },
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no sheets to pivot. Import data.'},
            searchTerms: ['search', 'find', 'filter', 'lookup'],
            tooltip: "Search for a value in your data and replace with another value."
        },
        [ActionEnum.Open_Next_Sheet]: {
            type: 'build-time',
            staticType: ActionEnum.Open_Next_Sheet,
            longTitle: 'Open Next Sheet',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
                
                const selectedSheetIndex = uiState.selectedSheetIndex;
                const selectedGraphID = uiState.currOpenTaskpane.type === TaskpaneType.GRAPH ? uiState.currOpenTaskpane.openGraph.graphID : undefined;
                
                if (selectedGraphID !== undefined) {
                    const graphIndex = analysisData.graphDataArray.findIndex(graphData => graphData.graph_id === selectedGraphID);
                    if (graphIndex === -1 || graphIndex === analysisData.graphDataArray.length - 1) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenTaskpane: {type: TaskpaneType.NONE},
                                selectedTabType: 'data',
                                selectedSheetIndex: 0
                            }
                        });
                    } else {
                        void openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {
                            type: 'existing_graph',
                            graphID: analysisData.graphDataArray[graphIndex + 1].graph_id
                        })
                        return;
                    }
                } else {
                    if (selectedSheetIndex === sheetDataArray.length - 1 && analysisData.graphDataArray.length > 0) {
                        void openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {
                            type: 'existing_graph',
                            graphID: analysisData.graphDataArray[0].graph_id
                        })
                        return;
                    } else {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                selectedSheetIndex: selectedSheetIndex === sheetDataArray.length - 1 ? 0 : selectedSheetIndex + 1
                            }
                        });
                    }
                }
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['sheet', 'index', 'next', 'forward'],
            tooltip: "Go to the next sheet."
        },
        [ActionEnum.Open_Previous_Sheet]: {
            type: 'build-time',
            staticType: ActionEnum.Open_Previous_Sheet,
            longTitle: 'Open Previous Sheet',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                const selectedSheetIndex = uiState.selectedSheetIndex;
                const selectedGraphID = uiState.currOpenTaskpane.type === TaskpaneType.GRAPH ? uiState.currOpenTaskpane.openGraph.graphID : undefined;
                
                if (selectedGraphID !== undefined) {
                    const graphIndex = analysisData.graphDataArray.findIndex(graphData => graphData.graph_id === selectedGraphID);
                    if (graphIndex === -1 || graphIndex === 0) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenTaskpane: {type: TaskpaneType.NONE},
                                selectedTabType: 'data',
                                selectedSheetIndex: sheetDataArray.length - 1
                            }
                        });
                    } else {
                        void openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {
                            type: 'existing_graph',
                            graphID: analysisData.graphDataArray[graphIndex - 1].graph_id
                        })
                        return;
                    }
                } else {
                    if (selectedSheetIndex === 0 && analysisData.graphDataArray.length > 0) {
                        void openGraphSidebar(setUIState, uiState, setEditorState, sheetDataArray, mitoAPI, {
                            type: 'existing_graph',
                            graphID: analysisData.graphDataArray[analysisData.graphDataArray.length - 1].graph_id
                        })
                        return;
                    } else {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                selectedSheetIndex: selectedSheetIndex === 0 ? sheetDataArray.length - 1 : selectedSheetIndex - 1
                            }
                        });
                    }
                }
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['sheet', 'index', 'previous', 'last'],
            tooltip: "Go to the previous sheet."
        },
        [ActionEnum.Undo]: {
            type: 'build-time',
            staticType: ActionEnum.Undo,
            iconToolbar: UndoIcon,
            longTitle: 'Undo',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
        
                // We close the editing taskpane if its open
                closeOpenEditingPopups(ALLOW_UNDO_REDO_EDITING_TASKPANES);
        
                await mitoAPI.updateUndo();
                
                const currOpenTaskpane = uiState.currOpenTaskpane;
                if (currOpenTaskpane.type === TaskpaneType.GRAPH) {
                    if (!analysisData.graphDataArray.find(graphData => graphData.graph_id === currOpenTaskpane.openGraph.graphID)) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenTaskpane: {type: TaskpaneType.NONE},
                                selectedTabType: 'data'
                            }
                        })
                    }
                }
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['undo', 'go back', 'redo'],
            tooltip: 'Undo the most recent edit.'
        },
        [ActionEnum.Unique_Values]: {
            type: 'build-time',
            staticType: ActionEnum.Unique_Values,
            iconContextMenu: StarIcon,
            titleToolbar: 'Unique Values',
            titleContextMenu: 'Column Unique Values',
            longTitle: 'View unique values',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                if (typeof uiState.currOpenDropdown === 'object' && uiState.currOpenDropdown.type === 'context-menu') {
                    const rowIndex = uiState.currOpenDropdown.rowIndex;
                    const columnIndex = uiState.currOpenDropdown.columnIndex;
                    setGridState(prevGridState => {
                        return {
                            ...prevGridState,
                            selections: [{
                                sheetIndex: sheetIndex,
                                startingRowIndex: rowIndex,
                                startingColumnIndex: columnIndex,
                                endingRowIndex: rowIndex,
                                endingColumnIndex: columnIndex
                            }]
                        }
                    })
                }

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                        selectedColumnControlPanelTab: ControlPanelTab.UniqueValues,
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['unique values', 'values', 'toggle', 'filter'],
            tooltip: "See a list of unique values in the column, and toggle to filter them."
        },
        [ActionEnum.Upgrade_To_Pro]: {
            type: 'build-time',
            staticType: ActionEnum.Upgrade_To_Pro,
            titleToolbar: 'Upgrade to Pro',
            longTitle: 'Upgrade to Mito Pro',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.UPGRADE_TO_PRO, proOrEnterprise: 'Pro'},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['pro', 'upgrade', 'mito pro', 'open source'],
            tooltip: "Upgrade to a Mito Pro account and get access to all of Mito Pro's functionality."
        },
        [ActionEnum.Transpose]: {
            type: 'build-time',
            staticType: ActionEnum.Transpose,
            iconToolbar: TransposeIcon,
            titleToolbar: 'Transpose',
            longTitle: 'Transpose dataframe',
            actionFunction: () => {
                void mitoAPI.editTranspose(sheetIndex);
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'Import data before transposing it'},
            searchTerms: ['transpose', 'diagonal', 'rows and columns', 'flip', 'rotate'],
            tooltip: "Switches rows and columns in a dataframe"
        },
        [ActionEnum.Melt]: {
            type: 'build-time',
            staticType: ActionEnum.Melt,
            iconToolbar: UnpivotIcon,
            titleToolbar: 'Unpivot',
            longTitle: 'Unpivot dataframe',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.MELT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : "Import data before trying to unpivot it"},
            searchTerms: ['Melt', 'Unpivot'],
            tooltip: "Unpivot a DataFrame from wide to long format."
        },
        [ActionEnum.One_Hot_Encoding]: {
            type: 'build-time',
            staticType: ActionEnum.One_Hot_Encoding,
            iconToolbar: OneHotEncodingIcon,
            titleToolbar: 'One-hot Encoding',
            longTitle: 'One-hot Encoding',
            actionFunction: () => {
                if (columnID) {
                    closeOpenEditingPopups();
                    void mitoAPI.editOneHotEncoding(sheetIndex, columnID);
                }
            },
            isDisabled: () => {return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? defaultActionDisabledMessage : 'There are no columns in the selected sheet. Add data to the sheet.'},
            searchTerms: ['one-hot encoding', 'dummies', 'get dummies', 'categorical'],
            tooltip: "One Hot Encoding"
        },
        [ActionEnum.Set_Dataframe_Format]: {
            type: 'build-time',
            staticType: ActionEnum.Set_Dataframe_Format,
            iconToolbar: FormatIcon,
            iconContextMenu: FormatContextMenuIcon,
            titleToolbar: 'Format',
            longTitle: 'Set dataframe colors',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.SET_DATAFRAME_FORMAT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There are no data to format. Import data before formatting.'}, 
            searchTerms: ['Set dataframe format', 'dataframe', 'format', 'color', 'color palette', 'border', 'highlight'],
            tooltip: "Change the styling of the header, rows, and border of the dataframe."
        },
        [ActionEnum.Conditional_Formatting]: {
            type: 'build-time',
            staticType: ActionEnum.Conditional_Formatting,
            iconToolbar: ConditionalFormatIcon,
            titleToolbar: 'Conditional Formatting',
            longTitle: 'Conditional formatting',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CONDITIONALFORMATTING},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'There is no data to format. Import data.';
            },
            searchTerms: ['formatting', 'conditional', 'color', 'background', 'highlight'],
            tooltip: "Set the background color and text color of the cell based on a condition."
        },
        [ActionEnum.Dataframe_Import]: {
            type: 'build-time',
            staticType: ActionEnum.Dataframe_Import,
            iconToolbar: DataFrameImportIcon,
            titleToolbar: 'Import Dataframes',
            longTitle: 'Import dataframes',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.DATAFRAMEIMPORT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return defaultActionDisabledMessage},
            searchTerms: ['Dataframe Import'],
            tooltip: "Dataframe Import"
        },
        [ActionEnum.UPDATEIMPORTS]: {
            type: 'build-time',
            staticType: ActionEnum.UPDATEIMPORTS,
            iconToolbar: GearIcon,
            titleToolbar: 'Change imports',
            longTitle: 'Change imported data',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.UPDATEIMPORTS},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return sendFunctionStatus !== 'finished' ? defaultActionDisabledMessage : undefined},
            searchTerms: ['update', 'imports', 'replay', 'refresh', 'change'],
            tooltip: "Change imported data to rerun the same edits on new data."
        },
        [ActionEnum.CODESNIPPETS]: {
            type: 'build-time',
            staticType: ActionEnum.CODESNIPPETS,
            iconToolbar: CodeSnippetIcon,
            titleToolbar: 'Code Snippets',
            longTitle: 'Code Snippets',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CODESNIPPETS},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return undefined},
            searchTerms: ['CodeSnippets'],
            tooltip: "View code snippets. "
        },
        [ActionEnum.CODEOPTIONS]: {
            type: 'build-time',
            staticType: ActionEnum.CODEOPTIONS,
            iconToolbar: GearIcon,
            titleToolbar: 'Configure Code',
            longTitle: 'Configure Code',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.CODEOPTIONS},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return undefined},
            searchTerms: ['Code Options', 'function', 'parameterize'],
            tooltip: "Configure how the code is generated."
        },
        [ActionEnum.EXPORT_TO_FILE]: {
            type: 'build-time',
            staticType: ActionEnum.EXPORT_TO_FILE,
            titleToolbar: 'Download File when Executing Code',
            longTitle: 'Download File when Executing Code',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.EXPORT_TO_FILE},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'Import data before exporting it'},
            searchTerms: ['export', 'download', 'file'],
            tooltip: "Generate code that exports dataframes to files."
        },

        [ActionEnum.RESET_INDEX_DROPDOWN]: {
            type: 'build-time',
            staticType: ActionEnum.RESET_INDEX_DROPDOWN,
            iconToolbar: ResetIcon,
            titleToolbar: 'Reset Index',
            longTitle: 'Reset Index Dropdown',
            actionFunction: () => {
                setEditorState(undefined);
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: 'reset-index'
                    }
                })
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? defaultActionDisabledMessage : 'Import data before resetting an index.'
            },
            searchTerms: ['reset', 'download', 'excel', 'csv'],
            tooltip: "Reset index"
        },
        [ActionEnum.RESET_AND_KEEP_INDEX]: {
            type: 'build-time',
            staticType: ActionEnum.RESET_AND_KEEP_INDEX,
            iconContextMenu: ResetIndexIcon,
            titleToolbar: 'Reset and Keep Index',
            longTitle: 'Reset and Keep Index',
            actionFunction: () => {
                void mitoAPI.editResetIndex(sheetIndex, false);
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'Import data before resetting an index.'},
            searchTerms: ['reset', 'index'],
            tooltip: "Resets a dataframe's index to 0,1,2,3... Keeps the current index as a column in the dataframe."
        },
        [ActionEnum.RESET_AND_DROP_INDEX]: {
            type: 'build-time',
            staticType: ActionEnum.RESET_AND_DROP_INDEX,
            iconContextMenu: ResetAndDropIndexIcon,
            titleContextMenu: 'Reset Index',
            titleToolbar: 'Reset and Drop Index',
            longTitle: 'Reset and Drop Index',
            actionFunction: () => {
                void mitoAPI.editResetIndex(sheetIndex, true);
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'Import data before resetting an index.'},
            searchTerms: ['reset', 'index'],
            tooltip: "Resets a dataframe's index to 0,1,2,3... Removes current index entirely."
        },
        [ActionEnum.SNOWFLAKEIMPORT]: {
            type: 'build-time',
            staticType: ActionEnum.SNOWFLAKEIMPORT,
            iconToolbar: SnowflakeIcon,
            titleToolbar: 'Snowflake Import',
            longTitle: 'Snowflake Import',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.SNOWFLAKEIMPORT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT ? undefined : 'Snowflake Import is deactivated for this version of Mito. Please contact your admin with any questions.'},
            searchTerms: ['SQL', 'database', 'snowflake', 'import'],
            tooltip: "Import dataframe from a Snowflake data warehouse",
            requiredPlan: 'enterprise',
        },
        [ActionEnum.AI_TRANSFORMATION]: {
            type: 'build-time',
            staticType: ActionEnum.AI_TRANSFORMATION,
            iconToolbar: AIIcon,
            titleToolbar: 'AI',
            longTitle: 'AI Transformation',
            actionFunction: () => {
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.AITRANSFORMATION},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION ? undefined : 'AI Transformation is deactivated for this version of Mito. Please contact your admin with any questions.'},
            searchTerms: ['AI Transformation'],
            tooltip: "AI Transformation"
        },
        [ActionEnum.COLUMN_HEADERS_TRANSFORM]: {
            type: 'build-time',
            staticType: ActionEnum.COLUMN_HEADERS_TRANSFORM,
            iconToolbar: BulkHeaderTransformIcon,
            titleToolbar: 'Rename Columns',
            longTitle: 'Bulk column headers transform',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.COLUMN_HEADERS_TRANSFORM},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'Import data before transforming column headers'},
            searchTerms: ['Column Headers Transform', 'replace', 'uppercase', 'lowercase', 'headers'],
            tooltip: "Allows you to capitalize, lowercase, or replace column headers in bulk."
        },
        // AUTOGENERATED LINE: ACTION (DO NOT DELETE)    
    }


    const runtimeImportActionsList: RunTimeAction[] = analysisData.userDefinedImporters.map(f => {
        const displayName = getDisplayNameOfPythonVariable(f.name)
        return {
            type: 'run-time',
            staticType: f.name,
            titleToolbar: displayName,
            longTitle: displayName,
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {
                            type: TaskpaneType.USERDEFINEDIMPORT,
                            importer_name: f.name
                        },
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return undefined},
            searchTerms: displayName.split(' '),
            tooltip: f.docstring,
            domain: f.domain
        }
    })

    const runtimeEditActionsList: RunTimeAction[] = analysisData.userDefinedEdits.map(f => {
        const displayName = getDisplayNameOfPythonVariable(f.name)
        return {
            type: 'run-time',
            staticType: f.name,
            titleToolbar: displayName,
            longTitle: displayName,
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {
                            type: TaskpaneType.USER_DEFINED_EDIT,
                            edit_name: f.name
                        },
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return undefined},
            searchTerms: displayName.split(' '),
            tooltip: f.docstring
        }
    })

    return new Actions(buildTimeActions, runtimeImportActionsList, runtimeEditActionsList);
}

export const getSearchTermToActionEnumMapping = (actions: Record<ActionEnum, BuildTimeAction>): Record<string, ActionEnum[]> => {
    const searchTermToActionMapping: Record<string, ActionEnum[]> = {};
    Object.values(actions).forEach(action => {
        action.searchTerms.forEach(searchTerm => {
            if (!(searchTerm in searchTermToActionMapping)) {
                searchTermToActionMapping[searchTerm] = []
            }
            searchTermToActionMapping[searchTerm].push(action.staticType)
        })
    })
    return searchTermToActionMapping
}

const sortActionHelper = function(actionOne: Action, actionTwo: Action) {
    const titleOne = actionOne.longTitle ? actionOne.longTitle : actionOne.titleToolbar
    const titleTwo = actionTwo.longTitle ? actionTwo.longTitle : actionTwo.titleToolbar


    // Sort alphabetically
    if (!titleOne || !titleTwo || titleOne < titleTwo) {
        return -1;
    }
    if (titleOne > titleTwo) {
        return 1;
    }

    return 0;
}


/*
    Sort the provided actions in alphabetical order.
*/
export const getSortedActions = (actions: Actions): Action[] => {

    const runTimeImportActions: Action[] = Object.values(actions.runtimeImportActionsList);
    const runTimeEditActions: Action[] = Object.values(actions.runtimeEditActionsList);
    const buildTimeActions: Action[] = Object.values(actions.buildTimeActions);

    runTimeImportActions.sort(sortActionHelper);    
    runTimeEditActions.sort(sortActionHelper);
    buildTimeActions.sort(sortActionHelper);    

    return runTimeImportActions.concat(runTimeEditActions.concat(buildTimeActions));
}