// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { MitoSelection, SheetData, ActionEnum, UIState } from '../../types';
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
    mitoAPI: MitoAPI;
    sheetData: SheetData;
    sheetIndex: number;
    rowIndex: number;
    selections: MitoSelection[];
    display: boolean;
    index: string | number,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    actions: Actions;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element {

    // Log opening this dropdown
    useEffect(() => {
        if (props.display) {
            void props.mitoAPI.log('opened_index_header_dropdown')
        }
    }, [props.display])

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