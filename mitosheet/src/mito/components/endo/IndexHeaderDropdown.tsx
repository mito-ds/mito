// Copyright (c) Saga Inc.

import React from 'react';
import { ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { isCurrOpenDropdownForCell } from './visibilityUtils';
import { getPropsForContextMenuDropdownItem } from './utils';
import { Actions } from '../../utils/actions';

/*
    Displays a set of actions one can perform on a row
*/
export default function IndexHeaderDropdown(props: {
    display: boolean;
    rowIndex: number,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    actions: Actions;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element {
    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setUIState((prevUIState) => {
                const isCurrOpenDropdown = isCurrOpenDropdownForCell(prevUIState, props.rowIndex, -1);
                return {
                    ...prevUIState,
                    currOpenDropdown: isCurrOpenDropdown ? undefined : prevUIState.currOpenDropdown
                }
            })}
            width='medium-large'
        >
            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}
                title='Copy Row'
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete], props.closeOpenEditingPopups)}
                title='Delete Row'
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Promote_Row_To_Header], props.closeOpenEditingPopups)}/>

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_DROP_INDEX], props.closeOpenEditingPopups)}/>
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_KEEP_INDEX], props.closeOpenEditingPopups)}/>
        </Dropdown>
    )
}