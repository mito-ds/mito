// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI from '../../api';
import { GraphID, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';

/*
    Displays a set of actions one can perform on a sheet tab, including
    deleting, duplicating, or renaming.
*/
export default function SheetTabActions(props: {
    setDisplayActions: React.Dispatch<React.SetStateAction<boolean>>,
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    dfName: string, 
    mitoAPI: MitoAPI
    tabIDObj: {tabType: 'data', selectedIndex: number} | {tabType: 'graph', graphID: GraphID}
}): JSX.Element {

    // Log opening the sheet tab actions
    useEffect(() => {
        const selectedSheetIndexOrGraphID = props.tabIDObj.tabType === 'data' ? props.tabIDObj.selectedIndex : props.tabIDObj.graphID
        void props.mitoAPI.log(
            'clicked_sheet_tab_actions',
            {
                tab_type: props.tabIDObj.tabType,
                selected_index_or_graph_id: selectedSheetIndexOrGraphID
            }
        )
    }, [])

    const onDelete = async (): Promise<void> => {
        // If we are deleting a sheet tab, select the first sheet tab
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedTabType: 'data',
                selectedSheetIndex: 0
            }
        })

        // Close 
        props.closeOpenEditingPopups();

        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeDelete(props.tabIDObj.selectedIndex)
        }
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeDuplicate(props.tabIDObj.selectedIndex)
        }
    }

    /* Rename helper, which requires changes to the sheet tab itself */
    const onRename = (): void => {
        props.setIsRename(true);
    }

    return (
        <Dropdown
            closeDropdown={() => props.setDisplayActions(false)}
            width='small'
        >
            <DropdownItem 
                title='Delete'
                onClick={onDelete}
            />
            <DropdownItem 
                title='Duplicate'
                onClick={onDuplicate}
            />
            <DropdownItem 
                title='Rename'
                onClick={onRename}
            />
        </Dropdown>
    )
}
