// Copyright (c) Saga Inc.

import React, { useEffect } from 'react';
import MitoAPI from '../../jupyter/api';
import { SheetData, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import { TaskpaneType } from '../taskpanes/taskpanes';

/*
    Displays a set of actions one can perform on a index header
*/
export default function IndexHeaderDropdown(props: {
    mitoAPI: MitoAPI;
    setOpenIndexHeaderDropdown: React.Dispatch<React.SetStateAction<string | number | undefined>>,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    sheetIndex: number;
    index: string | number;
    sheetData: SheetData;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element {

    // Log opening this dropdown
    useEffect(() => {void props.mitoAPI.log('opened_index_header_dropdown')}, [])

    return (
        <Dropdown
            closeDropdown={() => props.setOpenIndexHeaderDropdown(undefined)}
            width='medium'
        >
            <DropdownItem 
                title='Delete Row'
                onClick={() => {
                    props.closeOpenEditingPopups();
                    void props.mitoAPI.editDeleteRow(props.sheetIndex, props.index);
                }}
            />
            <DropdownItem 
                title='Promote Row to Header'
                disabled={false} // TODO: we should disable this if there are dateimte or timedetlas
                onClick={() => {
                    console.log("TODO")
                }}
            />
        </Dropdown>
    )
}