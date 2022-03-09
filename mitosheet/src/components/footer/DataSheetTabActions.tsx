// Copyright (c) Mito

import React, { useEffect } from 'react';
import MitoAPI, { getRandomId } from '../../api';
import { GraphDataJSON, GraphID, SheetData, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import { ModalEnum } from '../modals/modals';
import { getDefaultGraphParams } from '../taskpanes/Graph/GraphUtils';

/*
    Helper function for finding all of the graph tab names
    that are created from a given sheet index
*/
export const getGraphTabNamesAndIDsFromSheetIndex = (sheetIndex: number, graphDataJSON: GraphDataJSON): ({graphTabName: string, graphID: GraphID})[] => {
    // Filter to only grapsh with the sheetIndex, and then get a list of the graph tab names
    const filteredGraphDataJSON: GraphDataJSON = Object.fromEntries(Object.entries(graphDataJSON).filter(([, graphData]) => {
        return graphData.graphParams.graphCreation.sheet_index === sheetIndex
    }))

    return Object.entries(filteredGraphDataJSON).map(([graphID, graphData]) => {
        return {graphTabName: graphData.graphTabName, graphID: graphID}
    })
} 

/*
    Displays a set of actions one can perform on a data sheet tab, including
    deleting, duplicating, or renaming, and creating a sheet.
*/
export default function SheetTabActions(props: {
    setDisplayActions: React.Dispatch<React.SetStateAction<boolean>>,
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI
    sheetIndex: number
    graphDataJSON: GraphDataJSON
    sheetDataArray: SheetData[]
}): JSX.Element {

    // Log opening the data sheet tab actions
    useEffect(() => {
        void props.mitoAPI.log(
            'clicked_data_sheet_tab_actions',
            {
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
    
    const graphData = async (): Promise<void> => {

        const newGraphID = getRandomId() // Create a new graph
        const graphParams = getDefaultGraphParams(props.sheetDataArray, props.sheetIndex)

        // In order to open the graph, we are watching for the graphDataJSON to change in length. This allows us to only display the graph taskpane
        // when the sheet tab exists. However, we need to know the stepID of the graph creation so that the configuration of the graph so that editing
        // the graph doesn't cause a new step to get created. We could either create a new piece of state in the that stores the stepID or we can save the 
        // stepID in the graphDataJSON. Neither are good options. 

        // NOTE: after trying to implement it as saving it in the state, I realized that this approach doesn't work due to race conditions 
        // in the return stepID from the editGraph call and the graphDATAJSON updating. 


        await props.mitoAPI.editGraph(
            newGraphID,
            graphParams.graphCreation.graph_type,
            graphParams.graphCreation.sheet_index,
            graphParams.graphPreprocessing.safety_filter_turned_on_by_user,
            graphParams.graphCreation.x_axis_column_ids,
            graphParams.graphCreation.y_axis_column_ids,
            `100%`, 
            `100%`, 
            undefined, 
        );
        
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
                    // doesn't compete updating the uiState to this sheet instead of
                    // the new graphID that we're creating
                    e?.stopPropagation()
                    void graphData()
                }}
            />
            <DropdownItem 
                title='Delete'
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete updating the uiState to the graphID that is gettind deleted
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

