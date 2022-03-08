// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI, { getRandomId } from '../../api';
import { GraphDataJSON, GraphID, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import { ModalEnum } from '../modals/modals';
import { TaskpaneType } from '../taskpanes/taskpanes';

/*
    Helper function for finding all of the graph tab names
    that are created from a given sheet index
*/
export const getGraphTabNamesAndIDsFromSheetIndex = (sheetIndex: number, graphDataJSON: GraphDataJSON): 
({graphTabName: string, graphID: GraphID})[] => {
    // Filter to only grapsh with the sheetIndex, and then get a list of the graph tab names
    const filteredGraphDataJSON: GraphDataJSON = Object.fromEntries(Object.entries(graphDataJSON).filter(([, graphData]) => {
        return graphData.graphParams.graphCreation.sheet_index === sheetIndex
    }))

    return Object.entries(filteredGraphDataJSON).map(([graphID, graphData]) => {
        return {graphTabName: graphData.graphTabName, graphID: graphID}
    })
} 

/*
    Displays a set of actions one can perform on a sheet tab, including
    deleting, duplicating, or renaming.
*/
export default function SheetTabActions(props: {
    setDisplayActions: React.Dispatch<React.SetStateAction<boolean>>,
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI
    sheetIndex: number
    graphDataJSON: GraphDataJSON
}): JSX.Element {

    // Log opening the sheet tab actions
    useEffect(() => {
        void props.mitoAPI.log(
            'clicked_sheet_tab_actions',
            {
                tab_type: 'data',
                sheet_index: props.sheetIndex
            }
        )
    }, [])

    const onDelete = async (): Promise<void> => {
        const dependantGraphTabNamesAndIDs = getGraphTabNamesAndIDsFromSheetIndex(props.sheetIndex, props.graphDataJSON)
        
        if (dependantGraphTabNamesAndIDs.length > 0) {
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenModal: {
                        type: ModalEnum.DeleteGraphs, 
                        dependantGraphTabNamesAndIDs: dependantGraphTabNamesAndIDs,
                        sheetIndex: props.sheetIndex
                    }
                }
            })
        } else {
            // Select the previous sheet
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    selectedTabType: 'data',
                    selectedSheetIndex: prevUIState.selectedSheetIndex > 0 ? prevUIState.selectedSheetIndex - 1 : 0,
                }
            })

            // Close 
            props.closeOpenEditingPopups();

            await props.mitoAPI.editDataframeDelete(props.sheetIndex)
        }


        
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        await props.mitoAPI.editDataframeDuplicate(props.sheetIndex)
        
    }

    /* Rename helper, which requires changes to the sheet tab itself */
    const onRename = (): void => {
        props.setIsRename(true);
    }
    
    const graphData = (): void => {
        props.setUIState(prevUIState => {
            const newGraphID = getRandomId() // Create a new graph
            return {
                ...prevUIState,
                selectedGraphID: newGraphID,
                selectedTabType: 'graph',
                currOpenTaskpane: {
                    type: TaskpaneType.GRAPH,
                    graphID: newGraphID
                },
            }
        })
    }

    return (
        <Dropdown
            closeDropdown={() => props.setDisplayActions(false)}
            width='small'
        >
            <DropdownItem
                title='Graph data'
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete updating the uiState.
                    e?.stopPropagation()
                    graphData()
                }}
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

