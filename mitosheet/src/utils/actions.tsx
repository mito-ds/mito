import fscreen from "fscreen";
import MitoAPI, { getRandomId } from "../api";
import { getStartingFormula } from "../components/endo/cellEditorUtils";
import { getColumnIndexesInSelections, getSelectedNumberSeriesColumnIDs, isSelectionsOnlyColumnHeaders } from "../components/endo/selectionUtils";
import { doesAnySheetExist, doesColumnExist, doesSheetContainData, getCellDataFromCellIndexes } from "../components/endo/utils";
import { ModalEnum } from "../components/modals/modals";
import { ControlPanelTab } from "../components/taskpanes/ControlPanel/ControlPanelTaskpane";
import { getDefaultGraphParams } from "../components/taskpanes/Graph/graphUtils";
import { TaskpaneType } from "../components/taskpanes/taskpanes";
import { DISCORD_INVITE_LINK } from "../data/documentationLinks";
import { FunctionDocumentationObject, functionDocumentationObjects } from "../data/function_documentation";
import { Action, ActionEnum, DFSource, EditorState, GridState, SheetData, UIState } from "../types"
import { getDeduplicatedArray } from "./arrays";
import { getColumnHeaderParts, getDisplayColumnHeader } from "./columnHeaders";
import { FORMAT_DISABLED_MESSAGE } from "./formatColumns";
import { fuzzyMatch } from "./strings";


export const createActions = (
    sheetDataArray: SheetData[], 
    gridState: GridState,
    dfSources: DFSource[],
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    setGridState: React.Dispatch<React.SetStateAction<GridState>>,
    mitoAPI: MitoAPI,
    mitoContainerRef: React.RefObject<HTMLDivElement>
): Record<ActionEnum, Action> => {
    // Define variables that we use in many actions
    const sheetIndex = gridState.sheetIndex;
    const sheetData = sheetDataArray[sheetIndex];
    const startingRowIndex = gridState.selections[gridState.selections.length - 1].startingRowIndex;
    const startingColumnIndex = gridState.selections[gridState.selections.length - 1].startingColumnIndex;
    const {columnID, columnFormula} = getCellDataFromCellIndexes(sheetData, startingRowIndex, startingColumnIndex);
    const startingColumnID = columnID;

    /*
        All of the actions that can be taken from the Action Search Bar. 
        Note: This doesn't represent *every* action that can be taken in the app. 
        For example, the Filter action opens the column control panel, but it doesn't
        actually create a filter. That is handled by the taskpane. 

        The actions are listed in 2 sections, both in alphabetical order: non-spreadsheet formulas, 
        followed by all of the spreadsheet formulas. 
    */
    const actions: Record<ActionEnum, Action> = {
        [ActionEnum.Add_Column]: {
            type: ActionEnum.Add_Column,
            shortTitle: 'Add Col',
            longTitle: 'Add a column',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                const getNewColumnHeader = (): string => {
                    let result = '';
                    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
                    const charactersLength = characters.length;
                    for (let i = 0; i < 4; i++) {
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                    }
                    return result;
                }

                const newColumnHeader = 'new-column-' + getNewColumnHeader()
                // The new column should be placed 1 position to the right of the last selected column
                const newColumnHeaderIndex = gridState.selections[gridState.selections.length - 1].endingColumnIndex + 1;

                void mitoAPI.editAddColumn(
                    sheetIndex,
                    newColumnHeader,
                    newColumnHeaderIndex
                );
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'Create a sheet by importing data before adding a column.'},
            searchTerms: ['add column', 'add col', 'new column', 'new col', 'insert column', 'insert col'],
            tooltip: "Add a new formula column to the right of your selection."
        },
        [ActionEnum.Change_Dtype]: {
            type: ActionEnum.Change_Dtype,
            shortTitle: 'Change Dtype',
            longTitle: 'Change dtype of column',
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
                if (!doesAnySheetExist(sheetDataArray)) {
                    return 'There are no columns to change the dtype of. Import data before changing the dtype.';
                } 

                if (columnFormula !== undefined && columnFormula.length > 0) {
                    return "To cast the type of a formula column use the spreadsheet functions VALUE, TEXT, BOOL, or DATEVALUE.";
                }

                return undefined;
            },
            searchTerms: ['change dtype', 'dtype', 'cast', 'boolean', 'string', 'number', 'float', 'int', 'datetime', 'date', 'timedelta'],
            tooltip: "Cast the dtype of your data column to a string, int, float, boolean, datetime, or timedelta."
        },
        [ActionEnum.Clear]: {
            type: ActionEnum.Clear,
            shortTitle: 'Clear',
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
            isDisabled: () => {return undefined},
            searchTerms: ['clear', 'reset', 'undo', 'redo'],
            tooltip: "Removes all of the transformations you've made to imported dataframes."
        },
        [ActionEnum.Column_Summary]: {
            type: ActionEnum.Column_Summary,
            shortTitle: 'Column Summary',
            longTitle: 'Column summary statistics and graph',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

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
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? undefined : 'There are no columns to summarize in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['column summary', 'describe', 'stats'],
            tooltip: "Learn about the distribution of the data in the selected column."
        },
        [ActionEnum.Delete_Column]: {
            type: ActionEnum.Delete_Column,
            shortTitle: 'Del Col',
            longTitle: 'Delete selected columns',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

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
                if (doesColumnExist(startingColumnID, sheetIndex, sheetDataArray)) {
                    if (isSelectionsOnlyColumnHeaders(gridState.selections)) {
                        return undefined
                    } else {
                        return "The selection contains individual cells. Click on column headers to select entire columns only."
                    }
                } else {
                    return "There are no columns in the sheet to delete. Add data to the sheet."
                }
            },
            searchTerms: ['delete column', 'delete col', 'del col', 'del column', 'remove column', 'remove col'],
            tooltip: "Delete all of the selected columns from the sheet."
        },
        [ActionEnum.Delete_Sheet]: {
            type: ActionEnum.Delete_Sheet,
            shortTitle: 'Delete Sheet',
            longTitle: 'Delete sheet',
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
                return doesAnySheetExist(sheetDataArray) ? undefined : "There are no sheets to delete."
            },
            searchTerms: ['delete', 'delete dataframe', 'delete sheet', 'del', 'del dataframe', 'del sheet', 'remove', 'remove dataframe', 'remove sheet'],
            tooltip: "Delete the selected sheet."
        },
        [ActionEnum.Docs]: {
            type: ActionEnum.Docs,
            shortTitle: 'Docs',
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
            type: ActionEnum.Drop_Duplicates,
            shortTitle: 'Dedup',
            longTitle: 'Deduplicate data',
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
                return doesAnySheetExist(sheetDataArray) ? undefined : "There are no sheets to operate on. Import data."
            },
            searchTerms: ['dedup', 'deduplicate', 'same', 'remove', 'drop duplicates', 'duplicates'],
            tooltip: "Remove duplicated rows from your dataframe."
        },
        [ActionEnum.Duplicate_Sheet]: {
            type: ActionEnum.Duplicate_Sheet,
            shortTitle: 'Duplicate Sheet',
            longTitle: 'Duplicate selected sheet',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                await mitoAPI.editDataframeDuplicate(sheetIndex)
            },
            isDisabled: () => {
                return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to duplicate. Import data.'
            },
            searchTerms: ['duplicate', 'copy'],
            tooltip: "Make a copy of the selected sheet."
        },
        [ActionEnum.Export]: {
            type: ActionEnum.Export,
            shortTitle: 'Export',
            longTitle: 'Export to .csv or .xlsx',
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
                return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to export.'
            },
            searchTerms: ['export', 'download', 'excel', 'csv'],
            tooltip: "Download the current Mito sheet as a .csv or .xlsx file."
        },
        [ActionEnum.Filter]: {
            type: ActionEnum.Filter,
            shortTitle: 'Filter',
            longTitle: 'Filter selected column',
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
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? undefined : 'There are no columns to filter in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['filter', 'remove', 'delete'],
            tooltip: "Filter this sheet based on the data in a column."
        },
        [ActionEnum.Format]: {
            type: ActionEnum.Format,
            shortTitle: 'Format',
            longTitle: 'Format selected number columns',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // Open the format toolbar dropdown
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        displayFormatToolbarDropdown: true
                    }
                })
            },
            isDisabled: () => {
                return getSelectedNumberSeriesColumnIDs(gridState.selections, sheetData).length > 0 ? undefined : FORMAT_DISABLED_MESSAGE
            },
            searchTerms: ['format', 'decimals', 'percent', '%', 'scientific', 'Mill', 'Bill', 'round'],
            tooltip: "Format all of the selected columns as percents, choose the number of decimals, etc. This only changes the display of the data, and does not effect the underlying dataframe."
        },
        [ActionEnum.Fullscreen]: {
            type: ActionEnum.Fullscreen,
            shortTitle: 'Fullscreen',
            longTitle: 'Fullscreen mode',
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
            },
            isDisabled: () => {return undefined},
            searchTerms: ['fullscreen', 'zoom'],
            tooltip: "Enter fullscreen mode to see more of your data."
        },
        [ActionEnum.Graph]: {
            type: ActionEnum.Graph,
            shortTitle: 'Graph',
            longTitle: 'Graph',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                const newGraphID = getRandomId() // Create a new GraphID
                const graphParams = getDefaultGraphParams(sheetDataArray, sheetIndex)

                await mitoAPI.editGraph(
                    newGraphID,
                    graphParams,
                    '100%',
                    '100%',
                    undefined, 
                );
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to graph. Import data.'},
            searchTerms: ['graph', 'chart', 'visualize', 'bar chart', 'box plot', 'scatter plot', 'histogram'],
            tooltip: "Create an interactive graph. Pick from bar charts, histograms, scatter plots, etc."
        },
        [ActionEnum.Help]: {
            type: ActionEnum.Help,
            shortTitle: 'Help',
            longTitle: 'Help',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // Open discord
                window.open(DISCORD_INVITE_LINK, '_blank')
            },
            isDisabled: () => {return undefined},
            searchTerms: ['help', 'contact', 'support'],
            tooltip: "Join our Discord for more help."
        },
        [ActionEnum.Import]: {
            type: ActionEnum.Import,
            shortTitle: 'Import',
            longTitle: 'Import .csv or .xlsx files',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                // we close the editing taskpane if its open
                closeOpenEditingPopups();

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {type: TaskpaneType.IMPORT},
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return undefined},
            searchTerms: ['import', 'upload', 'new', 'excel', 'csv'],
            tooltip: "Import any .csv or well-formatted .xlsx file as a new sheet."
        },
        [ActionEnum.Merge]: {
            type: ActionEnum.Merge,
            shortTitle: 'Merge',
            longTitle: 'Merge sheets together',
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
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to merge together. Import data.'},
            searchTerms: ['merge', 'join', 'vlookup', 'lookup', 'anti', 'diff', 'difference', 'unique'],
            tooltip: "Merge two sheets together using a lookup, left, right, inner, or outer join. Or find the differences between two sheets."
        },
        [ActionEnum.Concat_Sheets]: {
            type: ActionEnum.Concat_Sheets,
            shortTitle: 'Concat',
            longTitle: 'Concatenate two or more sheets together',
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
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to concat together. Import data.'},
            searchTerms: ['stack', 'merge', 'join', 'concat', 'concatenate', 'append'],
            tooltip: "Concatenate two or more sheets by stacking them vertically on top of eachother."
        },
        [ActionEnum.Pivot]: {
            type: ActionEnum.Pivot,
            shortTitle: 'Pivot',
            longTitle: 'Pivot Table',
            actionFunction: async () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
                
                // We check if the currently opened sheet is a result of a pivot table
                // and if so then we open the existing pivot table here, rather than
                // create a new pivot table. That is: if a user is on a pivot table, then
                // we let them edit that pivot table
                if (dfSources[sheetIndex] === DFSource.Pivoted) {
                    const existingPivotParams = await mitoAPI.getPivotParams(sheetIndex);
                    if (existingPivotParams !== undefined) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenModal: {type: ModalEnum.None},
                                currOpenTaskpane: {
                                    type: TaskpaneType.PIVOT,
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
                            destinationSheetIndex: undefined,
                            existingPivotParams: undefined
                        },
                        selectedTabType: 'data'
                    }
                })
            },
            isDisabled: () => {return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to pivot. Import data.'},
            searchTerms: ['pivot', 'group', 'group by', 'summarize', 'aggregate'],
            tooltip: "Create a Pivot Table to summarise data by breaking the data into groups and calculating statistics about each group."
        },
        [ActionEnum.Redo]: {
            type: ActionEnum.Redo,
            shortTitle: 'Redo',
            longTitle: 'Redo',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
    
                // We close the editing taskpane if its open
                closeOpenEditingPopups([TaskpaneType.PIVOT]);
    
                void mitoAPI.updateRedo();
            },
            isDisabled: () => {return undefined},
            searchTerms: ['redo', 'undo'],
            tooltip: "Reapplies the last step that you undid, as long as you haven't made any edits since the undo."
        },
        [ActionEnum.Rename_Column]: {
            type: ActionEnum.Rename_Column,
            shortTitle: 'Rename Column',
            longTitle: 'Rename selected column',
            actionFunction: () => {
                const columnHeader = getCellDataFromCellIndexes(sheetData, -1, startingColumnIndex).columnHeader;

                // Get the pieces of the column header. If the column header is not a MultiIndex header, then
                // lowerLevelColumnHeaders will be an empty array
                const columnHeaderSafe = columnHeader !== undefined ? columnHeader : ''
                const finalColumnHeader = getColumnHeaderParts(columnHeaderSafe).finalColumnHeader

                setEditorState({
                    rowIndex: -1,
                    columnIndex: startingColumnIndex,
                    formula: getDisplayColumnHeader(finalColumnHeader),
                })

            },
            isDisabled: () => {
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? undefined : 'There are no columns in the sheet to rename. Add data to the sheet.'
            },
            searchTerms: ['rename', 'name', 'header'],
            tooltip: "Rename the selected column."
        },
        [ActionEnum.Rename_Sheet]: {
            type: ActionEnum.Rename_Sheet,
            shortTitle: 'Rename Sheet',
            longTitle: 'Rename sheet',
            actionFunction: () => {
                // Use a query selector to get the div and then double click on it
                const selectedSheetTab = document.querySelector('.tab-selected') as HTMLDivElement | null;
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
                return doesAnySheetExist(sheetDataArray) ? undefined : 'There are no sheets to rename. Import data.'
            },
            searchTerms: ['rename', 'name'],
            tooltip: "Rename the selected sheet."
        },
        [ActionEnum.See_All_Functionality]: {
            type: ActionEnum.See_All_Functionality,
            shortTitle: 'See All Functionality',
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
        /* Search action is depreciated for now, until we add lazy loading or find and replace
        [ActionEnum.Search]: {
            type: ActionEnum.Search,
            shortTitle: 'Search',
            longTitle: 'Search values in sheet',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {
                            type: TaskpaneType.SEARCH,
                        },
                    }
                })
            },
            isDisabled: () => {return undefined},
            searchTerms: ['search', 'find and replace', 'find'],
            tooltip: "Search for a value in the sheet."
        }, */
        [ActionEnum.Set_Cell_Value]: {
            type: ActionEnum.Set_Cell_Value,
            shortTitle: 'Set Cell Value',
            longTitle: 'Set cell value',
            actionFunction: async () => {
                if (startingColumnID === undefined) {
                    return 
                }
                const startingFormula = getStartingFormula(sheetData, startingRowIndex, startingColumnIndex);

                setEditorState({
                    rowIndex: startingRowIndex,
                    columnIndex: startingColumnIndex,
                    formula: startingFormula,
                    // Since you can't reference other cells in a data column, we default to scrolling in the formula
                    arrowKeysScrollInFormula: true
                })
            },
            isDisabled: () => {
                if (!doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) || !doesSheetContainData(sheetIndex, sheetDataArray)) {
                    return 'There are no cells in the sheet to set the value of. Add data to the sheet.'
                } 

                if (columnFormula !== undefined && columnFormula.length > 0) {
                    return "You can't set the value of a formula column. Update the formula instead."
                }

                if (startingRowIndex === -1) {
                    return "An entire column is selected. Select a single cell to edit."
                }

                return undefined
            },
            searchTerms: ['formula', 'function', 'edit', 'set', 'set formula', 'set column formula'],
            tooltip: "Update the value of a specific cell in a data column."
        },
        [ActionEnum.Set_Column_Formula]: {
            type: ActionEnum.Set_Column_Formula,
            shortTitle: 'Set Column Formula',
            longTitle: 'Set column formula',
            actionFunction: async () => {            
                setEditorState({
                    rowIndex: startingRowIndex !== -1 ? startingRowIndex : 0,
                    columnIndex: startingColumnIndex,
                    formula: columnFormula !== undefined ? columnFormula : '',
                    // As in google sheets, if the starting formula is non empty, we default to the 
                    // arrow keys scrolling in the editor
                    arrowKeysScrollInFormula: columnFormula !== undefined && columnFormula.length > 0
                })
            },
            isDisabled: () => {
                if (!doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) || !doesSheetContainData(sheetIndex, sheetDataArray)) {
                    // If there is no data in the sheet, then there is no cell editor to open!
                    return 'There are no cells in the sheet to set the formula of. Add data to the sheet.'
                } 

                if (columnFormula === undefined || columnFormula.length == 0) {
                    return "You can't set the formula of a data column. Create a new column and set its formula instead."
                }

                return undefined
            },
            searchTerms: ['formula', 'function', 'edit', 'set', 'set formula', 'set column formula'],
            tooltip: "Use one of Mito's spreadsheet formulas or basic math operators to set the column's values."
        },
        [ActionEnum.Sort]: {
            type: ActionEnum.Sort,
            shortTitle: 'Sort',
            longTitle: 'Sort selected column',
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
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? undefined : 'There are no columns to sort in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['sort', 'ascending', 'descending', 'arrange'],
            tooltip: "Sort a column in ascending or descending order."
        },
        [ActionEnum.Steps]: {
            type: ActionEnum.Steps,
            shortTitle: 'Steps',
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
            isDisabled: () => {return undefined},
            searchTerms: ['steps', 'history'],
            tooltip: "View a list of all the edits you've made to your data."
        },
        [ActionEnum.Undo]: {
            type: ActionEnum.Undo,
            shortTitle: 'Undo',
            longTitle: 'Undo',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);
        
                // We close the editing taskpane if its open
                closeOpenEditingPopups([TaskpaneType.PIVOT, TaskpaneType.IMPORT]);
        
                void mitoAPI.updateUndo();
            },
            isDisabled: () => {return undefined},
            searchTerms: ['undo', 'go back', 'redo'],
            tooltip: 'Undo the most recent edit.'
        },
        [ActionEnum.Unique_Values]: {
            type: ActionEnum.Unique_Values,
            shortTitle: 'Unique Vals',
            longTitle: 'Unique Values',
            actionFunction: () => {
                // We turn off editing mode, if it is on
                setEditorState(undefined);

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
                return doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) ? undefined : 'There are no columns in the selected sheet. Add data to the sheet.'
            },
            searchTerms: ['unique values', 'values', 'toggle', 'filter'],
            tooltip: "See a list of unique values in the column, and toggle to filter them."
        },

        /*
            ** --------------------------- **
            
            Spreadsheet Formulas Section 

            ** --------------------------- **
        */
        [ActionEnum.ABS]: getSpreadsheetFormulaAction(
            ActionEnum.ABS,
            getFuncDocObjFromFuncName('abs'), 
            ['abs', 'absolute value'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.AND]: getSpreadsheetFormulaAction(
            ActionEnum.AND,
            getFuncDocObjFromFuncName('and'), 
            ['and', '&', 'if', 'conditional'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.AVG]: getSpreadsheetFormulaAction(
            ActionEnum.AVG,
            getFuncDocObjFromFuncName('avg'), 
            ['avg', 'average', 'mean'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.BOOL]: getSpreadsheetFormulaAction(
            ActionEnum.BOOL,
            getFuncDocObjFromFuncName('bool'), 
            ['bool', 'boolean', 'true', 'false', 'dtype', 'convert'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.CLEAN]: getSpreadsheetFormulaAction(
            ActionEnum.CLEAN,
            getFuncDocObjFromFuncName('clean'), 
            ['clean', 'trim', 'remove'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.CONCAT]: getSpreadsheetFormulaAction(
            ActionEnum.CONCAT,
            getFuncDocObjFromFuncName('concat'), 
            ['concat', 'concatenate', 'combine'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.CORR]: getSpreadsheetFormulaAction(
            ActionEnum.CORR,
            getFuncDocObjFromFuncName('corr'), 
            ['corr', 'correlation', 'r^2'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.DATEVALUE]: getSpreadsheetFormulaAction(
            ActionEnum.DATEVALUE,
            getFuncDocObjFromFuncName('datevalue'), 
            ['datevalue', 'date value', 'date', 'string to date', 'datetime', 'dtype', 'convert'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.DAY]: getSpreadsheetFormulaAction(
            ActionEnum.DAY,
            getFuncDocObjFromFuncName('day'), 
            ['day', 'date'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.ENDOFBUSINESSMONTH]: getSpreadsheetFormulaAction(
            ActionEnum.ENDOFBUSINESSMONTH,
            getFuncDocObjFromFuncName('endofbusinessmonth'), 
            ['business', 'month', 'EOM', 'EOBM', 'date', 'workday', 'end'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.ENDOFMONTH]: getSpreadsheetFormulaAction(
            ActionEnum.ENDOFMONTH,
            getFuncDocObjFromFuncName('endofmonth'), 
            ['month', 'EOM', 'EOM', 'date', 'eomonth', 'end'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.EXP]: getSpreadsheetFormulaAction(
            ActionEnum.EXP,
            getFuncDocObjFromFuncName('exp'), 
            ['exp', 'exponent', 'log', 'natural log'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.FILLNAN]: getSpreadsheetFormulaAction(
            ActionEnum.FILLNAN,
            getFuncDocObjFromFuncName('fillnan'), 
            ['fillnan', 'nan', 'fill nan', 'missing values', 'null', 'null value', 'fill null'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.FIND]: getSpreadsheetFormulaAction(
            ActionEnum.FIND,
            getFuncDocObjFromFuncName('find'), 
            ['find', 'search'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.HOUR]: getSpreadsheetFormulaAction(
            ActionEnum.HOUR,
            getFuncDocObjFromFuncName('hour'), 
            ['hour', 'hr', 'extract'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.IF]: getSpreadsheetFormulaAction(
            ActionEnum.IF,
            getFuncDocObjFromFuncName('if'), 
            ['if', 'conditional', 'and', 'or'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.KURT]: getSpreadsheetFormulaAction(
            ActionEnum.KURT,
            getFuncDocObjFromFuncName('kurt'), 
            ['kurt', 'kurtosis'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.LEFT]: getSpreadsheetFormulaAction(
            ActionEnum.LEFT,
            getFuncDocObjFromFuncName('left'), 
            ['left', 'parse'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.LEN]: getSpreadsheetFormulaAction(
            ActionEnum.LEN,
            getFuncDocObjFromFuncName('len'), 
            ['len', 'length', 'size'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.LOWER]: getSpreadsheetFormulaAction(
            ActionEnum.LOWER,
            getFuncDocObjFromFuncName('lower'), 
            ['lower', 'conditional'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.MAX]: getSpreadsheetFormulaAction(
            ActionEnum.MAX,
            getFuncDocObjFromFuncName('max'), 
            ['max', 'largest', 'biggest'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.MID]: getSpreadsheetFormulaAction(
            ActionEnum.MID,
            getFuncDocObjFromFuncName('mid'), 
            ['mid', 'middle', 'parse'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.MIN]: getSpreadsheetFormulaAction(
            ActionEnum.MIN,
            getFuncDocObjFromFuncName('min'), 
            ['min', 'minimum', 'smallest'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.MINUTE]: getSpreadsheetFormulaAction(
            ActionEnum.MINUTE,
            getFuncDocObjFromFuncName('minute'), 
            ['minute', 'min', 'extract'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.MONTH]: getSpreadsheetFormulaAction(
            ActionEnum.MONTH,
            getFuncDocObjFromFuncName('month'), 
            ['month', 'date'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.MULTIPLY]: getSpreadsheetFormulaAction(
            ActionEnum.MULTIPLY,
            getFuncDocObjFromFuncName('multiply'), 
            ['multiply'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.OR]: getSpreadsheetFormulaAction(
            ActionEnum.OR,
            getFuncDocObjFromFuncName('or'), 
            ['or', 'if', 'conditional'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.POWER]: getSpreadsheetFormulaAction(
            ActionEnum.POWER,
            getFuncDocObjFromFuncName('power'), 
            ['power', 'exponent'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.PROPER]: getSpreadsheetFormulaAction(
            ActionEnum.PROPER,
            getFuncDocObjFromFuncName('proper'), 
            ['proper', 'name'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.QUARTER]: getSpreadsheetFormulaAction(
            ActionEnum.QUARTER,
            getFuncDocObjFromFuncName('quarter'), 
            ['quarter',],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.RIGHT]: getSpreadsheetFormulaAction(
            ActionEnum.RIGHT,
            getFuncDocObjFromFuncName('right'), 
            ['right', 'parse'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.ROUND]: getSpreadsheetFormulaAction(
            ActionEnum.ROUND,
            getFuncDocObjFromFuncName('round'), 
            ['round', 'decimal'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.SECOND]: getSpreadsheetFormulaAction(
            ActionEnum.SECOND,
            getFuncDocObjFromFuncName('second'), 
            ['second', 'sec', 'extract'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.SKEW]: getSpreadsheetFormulaAction(
            ActionEnum.SKEW,
            getFuncDocObjFromFuncName('skew'), 
            ['skew'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STARTOFBUSINESSMONTH]: getSpreadsheetFormulaAction(
            ActionEnum.STARTOFBUSINESSMONTH,
            getFuncDocObjFromFuncName('startofbusinessmonth'), 
            ['business', 'month', 'SOM', 'SOBM', 'date', 'start'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STARTOFMONTH]: getSpreadsheetFormulaAction(
            ActionEnum.STARTOFMONTH,
            getFuncDocObjFromFuncName('startofmonth'), 
            ['month', 'SOM', 'date', 'start'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STRIPTIMETOMINUTES]: getSpreadsheetFormulaAction(
            ActionEnum.STRIPTIMETOMINUTES,
            getFuncDocObjFromFuncName('striptimetominutes'), 
            ['time', 'date', 'minutes', 'strip'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STRIPTIMETOHOURS]: getSpreadsheetFormulaAction(
            ActionEnum.STRIPTIMETOHOURS,
            getFuncDocObjFromFuncName('striptimetohours'), 
            ['time', 'date', 'hours', 'minutes', 'strip'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STRIPTIMETODAYS]: getSpreadsheetFormulaAction(
            ActionEnum.STRIPTIMETODAYS,
            getFuncDocObjFromFuncName('striptimetodays'), 
            ['time', 'date', 'remove', 'days', 'hours', 'minutes', 'strip'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STRIPTIMETOMONTHS]: getSpreadsheetFormulaAction(
            ActionEnum.STRIPTIMETOMONTHS,
            getFuncDocObjFromFuncName('striptimetomonths'), 
            ['time', 'date', 'remove', 'months', 'days', 'hours', 'minutes', 'strip'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.STRIPTIMETOYEARS]: getSpreadsheetFormulaAction(
            ActionEnum.STRIPTIMETOYEARS,
            getFuncDocObjFromFuncName('striptimetoyears'), 
            ['time', 'date', 'remove', 'years', 'months', 'days', 'hours', 'minutes', 'strip'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.SUBSTITUTE]: getSpreadsheetFormulaAction(
            ActionEnum.SUBSTITUTE,
            getFuncDocObjFromFuncName('substitute'), 
            ['substitute', 'replace', 'find and replace'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.SUM]: getSpreadsheetFormulaAction(
            ActionEnum.SUM,
            getFuncDocObjFromFuncName('sum'), 
            ['sum', 'add'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.TEXT]: getSpreadsheetFormulaAction(
            ActionEnum.TEXT,
            getFuncDocObjFromFuncName('text'), 
            ['text', 'string', 'dtype', 'convert'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.TRIM]: getSpreadsheetFormulaAction(
            ActionEnum.TRIM,
            getFuncDocObjFromFuncName('trim'), 
            ['trim', 'clean', 'whitespace'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.TYPE]: getSpreadsheetFormulaAction(
            ActionEnum.TYPE,
            getFuncDocObjFromFuncName('type'), 
            ['type', 'dtype', 'convert'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.UPPER]: getSpreadsheetFormulaAction(
            ActionEnum.UPPER,
            getFuncDocObjFromFuncName('upper'), 
            ['upper', 'capitalize'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.VALUE]: getSpreadsheetFormulaAction(
            ActionEnum.VALUE,
            getFuncDocObjFromFuncName('value'), 
            ['value', 'number', 'dtype', 'convert', 'parse string'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.VAR]: getSpreadsheetFormulaAction(
            ActionEnum.VAR,
            getFuncDocObjFromFuncName('var'), 
            ['var', 'variance'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.WEEK]: getSpreadsheetFormulaAction(
            ActionEnum.WEEK,
            getFuncDocObjFromFuncName('week'), 
            ['week', '1', '52', 'extract'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.WEEEKDAY]: getSpreadsheetFormulaAction(
            ActionEnum.WEEEKDAY,
            getFuncDocObjFromFuncName('weekday'), 
            ['weekday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
        [ActionEnum.YEAR]: getSpreadsheetFormulaAction(
            ActionEnum.YEAR,
            getFuncDocObjFromFuncName('year'), 
            ['year', 'date'],
            gridState, sheetDataArray, sheetIndex, setEditorState
        ),
    }

    return actions
}

export const getSearchTermToActionEnumMapping = (actions: Record<ActionEnum, Action>): Record<string, ActionEnum[]> => {
    const searchTermToActionMapping: Record<string, ActionEnum[]> = {};
    Object.values(actions).forEach(action => {
        action.searchTerms.forEach(searchTerm => {
            if (!(searchTerm in searchTermToActionMapping)) {
                searchTermToActionMapping[searchTerm] = []
            }
            searchTermToActionMapping[searchTerm].push(action.type)
        })
    })
    return searchTermToActionMapping
} 

// Creates a spreadsheet function actions 
export const getSpreadsheetFormulaAction = (
    type: ActionEnum,
    spreadsheetAction: FunctionDocumentationObject | undefined , 
    searchTerms: string[],
    gridState: GridState, 
    sheetDataArray: SheetData[], 
    sheetIndex: number,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>
): Action => {
    const action: Action = {
        type: type,
        shortTitle: spreadsheetAction?.function ? spreadsheetAction.function : '',
        actionFunction: () => {
            const columnIndex = gridState.selections[gridState.selections.length - 1].startingColumnIndex
            let rowIndex = gridState.selections[gridState.selections.length - 1].startingRowIndex

            // If the entire column is selected, then just open the cell editor for 
            // the first row
            if (rowIndex === -1) {
                rowIndex = 0
            }
                
            setEditorState({
                rowIndex: rowIndex,
                columnIndex: columnIndex,
                formula: "=" + spreadsheetAction?.function + "(",
                arrowKeysScrollInFormula: false
            })
        },
        isDisabled: () => {
            const startingRowIndex = gridState.selections[gridState.selections.length - 1].startingRowIndex
            const startingColumnIndex = gridState.selections[gridState.selections.length - 1].startingColumnIndex
            const startingColumnID = getCellDataFromCellIndexes(sheetDataArray[sheetIndex], startingRowIndex, startingColumnIndex).columnID

            if (!doesColumnExist(startingColumnID, sheetIndex, sheetDataArray) || !doesSheetContainData(sheetIndex, sheetDataArray)) {
                // If there is no data in the sheet, then there is no cell editor to open!
                return 'There are no cells in the sheet to set the formula of. Add data to the sheet.'
            } 

            const columnFormula = getCellDataFromCellIndexes(sheetDataArray[sheetIndex], 0, startingColumnIndex).columnFormula

            if (columnFormula === undefined || columnFormula.length == 0) {
                return "You can't set the formula of a data column. Create a new column and set its formula instead."
            }

            return undefined
        },
        searchTerms: searchTerms,
        tooltip: spreadsheetAction?.description ? spreadsheetAction.description : '',
        category: 'spreadsheet formula',
    }

    return action
}

/*
    Given a search term and a dict of actions, returns a list of actions that the search term represents
*/
export const getActionsToDisplay = (userSearchTerm: string, actions: Record<ActionEnum, Action>): Action[]  => {

    let displayedActions: Action[] = []
    if (userSearchTerm === '') {
        // If there is no search term, then display every action except the spreadsheet formulas as to not overwhelm
        displayedActions = Object.values(actions).filter(action => {
            return action.category !== 'spreadsheet formula'
        })

    } else {
        let displayedActionEnums: ActionEnum[] = []
        const searchTermToActionEnumMapping = getSearchTermToActionEnumMapping(actions)
        Object.keys(searchTermToActionEnumMapping).forEach(searchTerm => {
            const inSearch = fuzzyMatch(searchTerm, userSearchTerm) > .8 || fuzzyMatch(userSearchTerm, searchTerm) > .8;

            // If the searchTerm matches the userSearchTerm, then include all of the actions
            // that the searchTerm represents.
            if (inSearch) {
                displayedActionEnums = displayedActionEnums.concat(searchTermToActionEnumMapping[searchTerm])
            }
        });

        displayedActions = displayedActionEnums.map(actionEnum => {
            return actions[actionEnum]
        });
    }

    return getDeduplicatedArray(displayedActions)
}


/*
    Sort the provided actions in the order:
    1. The exact match if it exists
    2. All of the non-spreadsheet functions in alphabetical order
    3. All of the spreadsheet functions in alphabetical order, 
    4. The Search action
    4. The See_All_Functionality action
*/
export const getSortedActions = (userSearchTerm: string, actionsArray: Action[], actionsObj: Record<ActionEnum, Action>): Action[] => {

    actionsArray.sort(function(actionOne, actionTwo) {
        const titleOne = actionOne.longTitle ? actionOne.longTitle : actionOne.shortTitle
        const titleTwo = actionTwo.longTitle ? actionTwo.longTitle : actionTwo.shortTitle

        // Any spreadsheet formula comes after non spreadsheet formula
        if (actionOne.category == 'spreadsheet formula' && actionTwo.category != 'spreadsheet formula') {
            return 1
        }
        if (actionOne.category != 'spreadsheet formula' && actionTwo.category == 'spreadsheet formula') {
            return -1
        }

        // If both are spreadsheet formulas or not spreadsheet formulas, then sort alphabetically
        if (titleOne < titleTwo) {
            return -1;
        }
        if (titleOne > titleTwo) {
            return 1;
        }

        return 0;
    });

    // If the search term matches the title of an action, make sure that action is displayed first!
    const ustLowercase = userSearchTerm.toLowerCase()
    const exactMatchIndex = actionsArray.findIndex(action => {
        // Note: We don't use fuzzyMatch here, because fuzzy match only returns 0 or 1. There is no way to tell if its an exact match!
        return action.shortTitle.toLowerCase() === ustLowercase || (action.longTitle !== undefined && action.longTitle.toLowerCase() === ustLowercase)
    })
    if (exactMatchIndex !== -1) {
        const exactMatchAction = actionsArray.splice(exactMatchIndex)
        actionsArray.splice(0, 0, exactMatchAction[0]);
    }

    // Make sure the last two actions are Search (depreciated for now), See_All_Functionality, reguardless of the search term
    const actionEnumsToPutAtBottom: ActionEnum[] = [ActionEnum.See_All_Functionality]
    actionEnumsToPutAtBottom.forEach(actionEnum => {
        const actionIndex = actionsArray.findIndex(action => action.type === actionEnum)
        if (actionIndex !== -1) {
            actionsArray.splice(actionIndex, 1)
        }
        actionsArray.push(actionsObj[actionEnum])
    })

    return actionsArray
}

/* 
    Given a userSearchTerm and a record of actions, returns a sorted list of actions 
*/
export const getSortedActionsToDisplay = (userSearchTerm: string, actions: Record<ActionEnum, Action>): Action[] => {
    const actionsToDisplay = getActionsToDisplay(userSearchTerm, actions)
    return getSortedActions(userSearchTerm, actionsToDisplay, actions)  
}

/*
    Given a function name, return the function documentation object. 

    Note: This function is here and not in the function_documentation.tsx file because
    that file is created programatically and this funciton will get overwrriten.
*/
export const getFuncDocObjFromFuncName = (func: string): FunctionDocumentationObject | undefined => {
    return functionDocumentationObjects.find(fdo => fdo.function.toLowerCase() === func.toLowerCase())
}


