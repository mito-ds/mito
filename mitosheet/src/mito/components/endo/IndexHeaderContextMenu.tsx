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
export default function IndexHeaderContextMenu(props: {
    display: boolean;
    rowIndex: number,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    actions: Actions;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element {
    const [ currentSubmenu, setCurrentSubmenu ] = React.useState<string | undefined>(undefined);

    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => props.setUIState((prevUIState) => {
                const isCurrOpenDropdown = isCurrOpenDropdownForCell(prevUIState, props.rowIndex, -1);
                setCurrentSubmenu(undefined);
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
                onMouseEnter={() => setCurrentSubmenu('Delete Row')}
                subMenu={<Dropdown display={currentSubmenu === 'Delete Row'} position='horizontal' closeDropdown={() => props.setUIState((prevUIState) => {
                    const isCurrOpenDropdown = isCurrOpenDropdownForCell(prevUIState, props.rowIndex, -1);
                    return {
                        ...prevUIState,
                        currOpenDropdown: isCurrOpenDropdown ? undefined : prevUIState.currOpenDropdown
                    }
                })}>
                    <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}/>
                    <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}/>
                </Dropdown>}
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Promote_Row_To_Header], props.closeOpenEditingPopups)}/>

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem
                onMouseEnter={() => setCurrentSubmenu('Copy Row')}
                subMenu={<Dropdown display={currentSubmenu === 'Copy Row'} position='horizontal' closeDropdown={() => props.setUIState((prevUIState) => {
                    const isCurrOpenDropdown = isCurrOpenDropdownForCell(prevUIState, props.rowIndex, -1);
                    return {
                        ...prevUIState,
                        currOpenDropdown: isCurrOpenDropdown ? undefined : prevUIState.currOpenDropdown
                    }
                })}>
                    <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}/>
                    <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}/>
                </Dropdown>}
                {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_DROP_INDEX], props.closeOpenEditingPopups)}/>
            <DropdownItem {...getPropsForContextMenuDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_KEEP_INDEX], props.closeOpenEditingPopups)}/>
        </Dropdown>
    )
}