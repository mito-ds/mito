// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI from '../../api';
import { UIState } from '../../types';
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
    sheetIndex: number,
    selectedSheetIndex: number,
    mitoAPI: MitoAPI
}): JSX.Element {

    // Log opening the sheet tab actions
    useEffect(() => {
        void props.mitoAPI.sendLogMessage(
            'clicked_sheet_tab_actions',
            {
                sheet_index: props.sheetIndex
            }
        )
    }, [])

    const onDelete = async (): Promise<void> => {
        // If we are deleting the sheet index that is currently selected & it is not sheetIndex 0, update the selected sheet index
        if (props.sheetIndex === props.selectedSheetIndex && props.selectedSheetIndex !== 0) {
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    selectedSheetIndex: props.sheetIndex - 1
                }
            })
        }

        // Close 
        props.closeOpenEditingPopups();

        await props.mitoAPI.sendDataframeDeleteMessage(props.sheetIndex)
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        await props.mitoAPI.sendDataframeDuplicateMessage(props.sheetIndex)
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
