// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI, { getRandomId } from '../../api';
import { GraphID, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import { TaskpaneType } from '../taskpanes/taskpanes';

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
                selectedSheetIndex: 0,
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })

        // Close 
        props.closeOpenEditingPopups();

        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeDelete(props.tabIDObj.selectedIndex)
        } else {
            await props.mitoAPI.editGraphDelete(props.tabIDObj.graphID)
        }
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeDuplicate(props.tabIDObj.selectedIndex)
        } else {
            // Create the newGraphID so we can select the new graph tab
            const newGraphID = getRandomId()
            await props.mitoAPI.editGraphDuplicate(props.tabIDObj.graphID, newGraphID)

            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {
                        type: TaskpaneType.GRAPH,
                        graphID: newGraphID,
                        selectedGraphID: newGraphID,
                        selectedTabType: 'graph'
                    },
                }
            })

        }
    }

    /* Rename helper, which requires changes to the sheet tab itself */
    const onRename = (): void => {
        props.setIsRename(true);
    }
    
    const graphData = (): void => {
        // Do this type check so the compiler knows we can access the selectedIndex property
        if (props.tabIDObj.tabType === 'data') {
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {
                        type: TaskpaneType.GRAPH,
                        graphID: getRandomId() // Create a new graph
                    },
                    // Note: We don't set the selected graph tab because we don't know the graph ID yet. 
                    // Instead, we let the graphSidebar select the graph tab. 
                }
            })
        } 
    }

    return (
        <Dropdown
            closeDropdown={() => props.setDisplayActions(false)}
            width='small'
        >
            <DropdownItem
                title='Graph data'
                onClick={(e) => {
                    e?.stopPropagation()
                    graphData()
                }}
                disabled={props.tabIDObj.tabType === 'graph'}
            />
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
