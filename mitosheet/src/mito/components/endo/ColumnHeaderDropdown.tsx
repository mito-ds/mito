// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { ActionEnum, ColumnID, EditorState, GridState, SheetData, UIState } from '../../types';
import { isNumberDtype } from '../../utils/dtypes';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { ControlPanelTab } from '../taskpanes/ControlPanel/ControlPanelTaskpane';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { getStartingFormula } from './celleditor/cellEditorUtils';
import { getColumnIndexesInSelections } from './selectionUtils';
import { Actions } from '../../utils/actions';

/*
    Displays a set of actions one can perform on a column header
*/
export default function ColumnHeaderDropdown(props: {
    mitoAPI: MitoAPI;
    setOpenColumnHeaderDropdown: React.Dispatch<React.SetStateAction<boolean>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    openColumnHeaderEditor: () => void;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    sheetIndex: number;
    columnID: ColumnID;
    sheetData: SheetData
    columnDtype: string;
    display: boolean;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    gridState: GridState;
    actions: Actions;
}): JSX.Element {

    // Log opening this dropdown
    useEffect(() => {
        if (props.display) {
            void props.mitoAPI.log('opened_column_header_dropdown')
        }
    }, [props.display])
        

    // If the user interacts with the column header dropdown, we always default to 
    // selecting the first row for any action, like setting the column formula. 
    const rowIndex = 0 
    const columnIndex = Object.keys(props.sheetData.columnIDsMap).indexOf(props.columnID)

    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setOpenColumnHeaderDropdown(false)}
            width='medium'
        >
            <DropdownItem
                title='Insert Column Left'
                onClick={() => {
                    props.closeOpenEditingPopups();
                    void props.actions.buildTimeActions[ActionEnum.Add_Column_Left].actionFunction();
                }}
            />
            <DropdownItem
                title='Insert Column Right'
                onClick={() => {
                    props.closeOpenEditingPopups();
                    void props.actions.buildTimeActions[ActionEnum.Add_Column_Right].actionFunction();
                }}
            />
            <DropdownItem 
                title='Delete Column'
                onClick={() => {
                    props.closeOpenEditingPopups();
                    const columnIndexesSelected = getColumnIndexesInSelections(props.gridState.selections);
                    const columnIDsToDelete = columnIndexesSelected.map(colIdx => props.sheetData?.data[colIdx]?.columnID || '').filter(columnID => columnID !== '')

                    void props.mitoAPI.editDeleteColumn(props.sheetIndex, columnIDsToDelete);
                }}
            />
            <DropdownItem 
                title='Rename Column'
                onClick={() => {
                    props.openColumnHeaderEditor()
                }}
                supressFocusSettingOnClose
            />
            <DropdownSectionSeperator isDropdownSectionSeperator/>
            <DropdownItem
                title='Filter'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                            selectedColumnControlPanelTab: ControlPanelTab.FilterSort
                        }
                    })
                }}
            />
            
            <DropdownItem 
                title='Sort'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                            selectedColumnControlPanelTab: ControlPanelTab.FilterSort
                        }
                    })
                }}
            />
            <DropdownItem 
                title='Change Dtype'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                            selectedColumnControlPanelTab: ControlPanelTab.FilterSort
                        }
                    })
                }}
            />
            <DropdownItem 
                title='Fill NaN Values'
                onClick={() => {
                    const columnIndexesSelected = getColumnIndexesInSelections(props.gridState.selections);
                    const columnIDsToFillNaN = columnIndexesSelected.map(colIdx => props.sheetData?.data[colIdx]?.columnID || '').filter(columnID => columnID !== '')

                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.FILL_NA, startingColumnIDs: columnIDsToFillNaN},
                        }
                    })
                }}
            />
            <DropdownSectionSeperator isDropdownSectionSeperator/>
            <DropdownItem 
                title='Format'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL},
                            selectedColumnControlPanelTab: ControlPanelTab.FilterSort
                        }
                    })
                }}
                disabled={!isNumberDtype(props.columnDtype)}
                tooltip={!isNumberDtype(props.columnDtype) ? "Only number columns can be formatted currently" : undefined}
            />
            <DropdownItem 
                title='Conditional Format'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        const columnIndexesSelected = getColumnIndexesInSelections(props.gridState.selections);
                        const columnIDsToFormat = columnIndexesSelected.map(colIdx => props.sheetData?.data[colIdx]?.columnID || '').filter(columnID => columnID !== '')

                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.CONDITIONALFORMATTING, startingColumnIDs: columnIDsToFormat},
                        }
                    })
                }}
            />
            <DropdownSectionSeperator isDropdownSectionSeperator/>
            <DropdownItem 
                title='Set Column Formula'
                onClick={() => {
                    const {startingColumnFormula, arrowKeysScrollInFormula, editingMode} = getStartingFormula(props.sheetData, undefined, rowIndex, columnIndex);

                    props.setEditorState({
                        rowIndex: 0,
                        columnIndex: columnIndex,
                        formula: startingColumnFormula,
                        arrowKeysScrollInFormula: arrowKeysScrollInFormula,
                        editorLocation: 'cell',
                        editingMode: editingMode,
                        sheetIndex: props.sheetIndex,
                    })
                }}
                supressFocusSettingOnClose
            />
            <DropdownItem 
                title='Split Text to Columns'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.SPLIT_TEXT_TO_COLUMNS, startingColumnID: props.columnID},
                        }
                    })
                }}
            />
            <DropdownSectionSeperator isDropdownSectionSeperator/>
            <DropdownItem 
                title='View Unique Values'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {
                                type: TaskpaneType.CONTROL_PANEL,
                            },
                            selectedColumnControlPanelTab: ControlPanelTab.UniqueValues
                        }
                    })
                }}
            />
            <DropdownItem 
                title='View Summary Stats'
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {
                                type: TaskpaneType.CONTROL_PANEL,
                            },
                            selectedColumnControlPanelTab: ControlPanelTab.SummaryStats
                        }
                    })
                }}
            />
        </Dropdown>
    )
}