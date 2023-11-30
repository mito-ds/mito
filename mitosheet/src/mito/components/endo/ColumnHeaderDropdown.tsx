// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { ActionEnum, ColumnID, EditorState, GridState, SheetData, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import StepsIcon from '../icons/StepsIcon';
import { TaskpaneType } from '../taskpanes/taskpanes';
import SortAscendingIcon from '../icons/SortAscendingIcon';
import SortDescendingIcon from '../icons/SortDescendingIcon';

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
        
    const getPropsForDropdownItem = (actionName: ActionEnum) => {
        const action = props.actions.buildTimeActions[actionName];
        return {
            title: action.toolbarTitle ?? action.longTitle,
            onClick: () => {
                props.closeOpenEditingPopups();
                void action.actionFunction();
            },
            icon: action.contextMenuIcon ? <action.contextMenuIcon /> : action.toolbarIcon ? <action.toolbarIcon/> : <StepsIcon/>,
            rightText: action.displayKeyboardShortcuts?.mac
        }
    }

    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setOpenColumnHeaderDropdown(false)}
        >
            <DropdownItem {...getPropsForDropdownItem(ActionEnum.Copy)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem
                {...getPropsForDropdownItem(ActionEnum.Add_Column_Left)}
                title='Insert Column Left'
            />
            <DropdownItem
                {...getPropsForDropdownItem(ActionEnum.Add_Column_Right)}
                title='Insert Column Right'
            />
            <DropdownItem
                {...getPropsForDropdownItem(ActionEnum.Delete)}
                title='Delete Column'
            />
            <DropdownItem
                {...getPropsForDropdownItem(ActionEnum.Rename_Column)}
                title='Rename'
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(ActionEnum.Filter)}/>
            <DropdownItem
                {...getPropsForDropdownItem(ActionEnum.SortAscending)}
                title='Sort A to Z'
                icon={<SortAscendingIcon aColor='black'/>}
            />
            <DropdownItem {...getPropsForDropdownItem(ActionEnum.SortDescending)}
                title='Sort A to Z'
                icon={<SortDescendingIcon aColor='black'/>}
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(ActionEnum.Set_Dataframe_Format)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(ActionEnum.Column_Summary)}/>
            <DropdownItem {...getPropsForDropdownItem(ActionEnum.Unique_Values)} />
        </Dropdown>
    )
}