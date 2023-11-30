// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { ActionEnum, MitoSelection, SheetData } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { getPropsForDropdownItem } from './utils';
import { Actions } from '../../utils/actions';

/*
    Displays a set of actions one can perform on a row
*/
export default function IndexHeaderDropdown(props: {
    mitoAPI: MitoAPI;
    sheetData: SheetData;
    sheetIndex: number;
    selections: MitoSelection[];
    display: boolean;
    index: string | number,
    actions: Actions;
    setOpenIndexHeaderDropdown: React.Dispatch<React.SetStateAction<number | undefined>>,
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
            closeDropdown={() => props.setOpenIndexHeaderDropdown(undefined)}
            width='large'
        >
            <DropdownItem
                {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.closeOpenEditingPopups)}
                title='Copy Row'
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem
                {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete], props.closeOpenEditingPopups)}
                title='Delete Row'
            />

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.Promote_Row_To_Header], props.closeOpenEditingPopups)}/>

            <DropdownSectionSeperator isDropdownSectionSeperator={true}/>

            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_DROP_INDEX], props.closeOpenEditingPopups)}/>
            <DropdownItem {...getPropsForDropdownItem(props.actions.buildTimeActions[ActionEnum.RESET_AND_KEEP_INDEX], props.closeOpenEditingPopups)}/>
        </Dropdown>
    )
}