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
import { getPropsForDropdownItem } from './utils';

/*
    Displays a set of actions one can perform on a column header
*/
export default function ColumnHeaderDropdown(props: {
    mitoAPI: MitoAPI;
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

    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setUIState((prevUIState) => ({...prevUIState, currOpenDropdown: undefined}))}
        >
            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column_Left], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column_Right], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Rename_Column], props.closeOpenEditingPopups)} supressFocusSettingOnClose />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Filter], props.closeOpenEditingPopups)}/>
            <DropdownItem
                {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.SortAscending], props.closeOpenEditingPopups)}
                icon={<SortAscendingIcon aColor='black'/>}
            />
            <DropdownItem
                {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.SortDescending], props.closeOpenEditingPopups)}
                icon={<SortDescendingIcon aColor='black'/>}
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Set_Dataframe_Format], props.closeOpenEditingPopups)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Column_Summary], props.closeOpenEditingPopups)}/>
            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Unique_Values], props.closeOpenEditingPopups)} />
        </Dropdown>
    )
}