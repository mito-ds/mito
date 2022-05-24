// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import MitoAPI from '../../jupyter/api';
import { ColumnID, EditorState, SheetData, UIState } from '../../types';
import { isNumberDtype } from '../../utils/dtypes';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { ControlPanelTab } from '../taskpanes/ControlPanel/ControlPanelTaskpane';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { getCellDataFromCellIndexes } from './utils';

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
}): JSX.Element {

    // Log opening this dropdown
    useEffect(() => {void props.mitoAPI.log('opened_column_header_dropdown')}, [])

    // If the user interacts with the column header dropdown, we always default to 
    // selecting the first row for any action, like setting the column formula. 
    const rowIndex = 0 
    const columnIndex = Object.keys(props.sheetData.columnIDsMap).indexOf(props.columnID)
    const columnFormula = getCellDataFromCellIndexes(props.sheetData, rowIndex, columnIndex).columnFormula;

    return (
        <Dropdown
            closeDropdown={() => props.setOpenColumnHeaderDropdown(false)}
            width='medium'
        >
            <DropdownItem 
                title='Delete Column'
                onClick={() => {
                    void props.mitoAPI.editDeleteColumn(props.sheetIndex, [props.columnID]);
                }}
            />
            <DropdownItem 
                title='Rename Column'
                onClick={() => {
                    props.openColumnHeaderEditor()
                }}
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
            <DropdownSectionSeperator isDropdownSectionSeperator/>
            <DropdownItem 
                title='Set Column Formula'
                onClick={() => {
                    const columnFormula = getCellDataFromCellIndexes(props.sheetData, rowIndex, columnIndex).columnFormula;

                    props.setEditorState({
                        rowIndex: 0,
                        columnIndex: columnIndex,
                        formula: columnFormula !== undefined ? columnFormula : '',
                        // As in google sheets, if the starting formula is non empty, we default to the 
                        // arrow keys scrolling in the editor
                        arrowKeysScrollInFormula: columnFormula !== undefined && columnFormula.length > 0,
                        editorLocation: 'cell'
                    })
                }}
                disabled={columnFormula === undefined || columnFormula.length == 0}
                tooltip={columnFormula === undefined || columnFormula.length == 0 ? "Data columns don't support formulas" : undefined}
            />
            <DropdownItem 
                title='Split Text to Columns '
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