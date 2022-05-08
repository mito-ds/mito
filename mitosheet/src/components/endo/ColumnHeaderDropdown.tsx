// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import MitoAPI from '../../jupyter/api';
import { ColumnID, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
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
                    props.mitoAPI.editDeleteColumn(props.sheetIndex, [props.columnID]);
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
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL}
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
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL}
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
                            currOpenTaskpane: {type: TaskpaneType.CONTROL_PANEL}
                        }
                    })
                }}
            />
            
        </Dropdown>
    )
}