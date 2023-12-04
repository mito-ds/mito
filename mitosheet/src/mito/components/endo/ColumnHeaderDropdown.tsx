// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { ActionEnum, ColumnID, EditorState, GridState, SheetData, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { TaskpaneType } from '../taskpanes/taskpanes';
import SortAscendingIcon from '../icons/SortAscendingIcon';
import SortDescendingIcon from '../icons/SortDescendingIcon';
import { getPropsForContextMenuDropdownItem } from './utils';
import { isCurrOpenDropdownForCell } from './visibilityUtils';

/*
    Displays a set of actions one can perform on a column header
*/
export default function ColumnHeaderDropdown(props: {
    mitoAPI: MitoAPI;
    column: number;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    openColumnHeaderEditor: () => void;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    sheetIndex: number;
    columnID: ColumnID;
    sheetData: SheetData
    columnDtype: string;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    gridState: GridState;
    actions: Actions;
}): JSX.Element {
    const display = isCurrOpenDropdownForCell(props.uiState, -1, props.column)

    // Log opening this dropdown
    useEffect(() => {
        if (display) {
            void props.mitoAPI.log('opened_column_header_dropdown')
        }
    }, [display])

    return (
        <Dropdown
            display={display}
            closeDropdown={() => {
                props.setUIState((prevUIState) => {
                    // If the dropdown is open, then close it. Otherwise, don't change the state. 
                    const display = isCurrOpenDropdownForCell(prevUIState, -1, props.column);
                    return {
                        ...prevUIState,
                        currOpenDropdown: display ? undefined : prevUIState.currOpenDropdown
                    }
                })
            }}
        >
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column_Left], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column_Right], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Rename_Column], props.closeOpenEditingPopups)} supressFocusSettingOnClose />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Filter], props.closeOpenEditingPopups)}/>
            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.SortAscending], props.closeOpenEditingPopups)}
                icon={<SortAscendingIcon aColor='black'/>}
            />
            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.SortDescending], props.closeOpenEditingPopups)}
                icon={<SortDescendingIcon aColor='black'/>}
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Format_Number_Columns], props.closeOpenEditingPopups)}
                supressFocusSettingOnClose
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Column_Summary], props.closeOpenEditingPopups)}/>
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Unique_Values], props.closeOpenEditingPopups)} />
        </Dropdown>
    )
}