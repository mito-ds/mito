// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI, { getRandomId } from '../../api';
import { GraphDataJSON, GraphID, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import { TaskpaneType } from '../taskpanes/taskpanes';

/*
    Displays a set of actions one can perform on a sheet tab, including
    deleting, duplicating, or renaming.
*/
export default function GraphSheetTabActions(props: {
    setDisplayActions: React.Dispatch<React.SetStateAction<boolean>>,
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI,
    graphID: GraphID,
    graphDataJSON: GraphDataJSON
}): JSX.Element {

    // Log opening the sheet tab actions
    useEffect(() => {
        void props.mitoAPI.log(
            'clicked_sheet_tab_actions',
            {
                tab_type: 'graph',
                graph_id: props.graphID
            }
        )
    }, [])

    const onDelete = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();

        await props.mitoAPI.editGraphDelete(props.graphID)
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        // Create the newGraphID so we can select the new graph tab
        const newGraphID = getRandomId()
        await props.mitoAPI.editGraphDuplicate(props.graphID, newGraphID)

        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedGraphID: newGraphID,
                selectedTabType: 'graph',
                currOpenTaskpane: {
                    type: TaskpaneType.GRAPH,
                    graphID: newGraphID,
                },
            }
        })
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
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete updating the uiState.
                    e?.stopPropagation()
                    void onDelete()
                }}
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
