// Copyright (c) Saga Inc.

import React from 'react';
import { ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { getPropsForContextMenuDropdownItem } from './utils';
import { Actions } from '../../utils/actions';
import { isCurrOpenDropdownForCell } from './visibilityUtils';

/*
    Displays a set of actions one can perform on a row
*/
export default function CellDropdown(props: {
    display: boolean;
    rowIndex: number;
    colIndex: number;
    setUiState: React.Dispatch<React.SetStateAction<UIState>>;
    actions: Actions;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element {
    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => {
                props.setUiState((prevUIState) => {
                    const isCurrOpenDropdown = isCurrOpenDropdownForCell(prevUIState, props.rowIndex, props.colIndex);
                    return {
                        ...prevUIState,
                        currOpenDropdown: isCurrOpenDropdown ? undefined : prevUIState.currOpenDropdown
                    }
                })
            }}
            width='medium-large'
        >
            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}
                title='Copy'
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column_Left], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column_Right], props.closeOpenEditingPopups)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete_Row], props.closeOpenEditingPopups)} />
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete_Col], props.closeOpenEditingPopups)} />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Filter], props.closeOpenEditingPopups)}
                title='Create a Filter'
            />
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_KEEP_INDEX], props.closeOpenEditingPopups)}/>
        </Dropdown>
    )
}