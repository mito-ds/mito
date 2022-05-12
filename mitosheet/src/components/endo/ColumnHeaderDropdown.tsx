// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import MitoAPI from '../../jupyter/api';
import { ColumnID, UIState } from '../../types';
import { isNumberDtype } from '../../utils/dtypes';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { ControlPanelTab } from '../taskpanes/ControlPanel/ControlPanelTaskpane';
import { TaskpaneType } from '../taskpanes/taskpanes';

/*
    Displays a set of actions one can perform on a column header
*/
export default function ColumnHeaderDropdown(props: {
    mitoAPI: MitoAPI;
    setOpenColumnHeaderDropdown: React.Dispatch<React.SetStateAction<boolean>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    openColumnHeaderEditor: () => void;
    sheetIndex: number;
    columnID: ColumnID;
    columnDtype: string;
}): JSX.Element {

    // Log opening this dropdown
    useEffect(() => {void props.mitoAPI.log('opened_column_header_dropdown')}, [])

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