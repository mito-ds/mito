/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useEffect } from 'react';
import { MitoAPI } from '../../api/api';
import { ActionEnum, EditorState, GraphDataArray, GraphID, SheetData, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { deleteGraphs, getParamsForExistingGraph, openGraphSidebar } from '../taskpanes/Graph/graphUtils';
import { TaskpaneType } from '../taskpanes/taskpanes';


/*
    Displays a set of actions one can perform on a graph sheet tab, including
    deleting, duplicating, or renaming.
*/
export default function GraphTabContextMenu(props: {
    setDisplayActions: (display: boolean) => void,
    setIsRename: React.Dispatch<React.SetStateAction<boolean>>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI,
    graphID: GraphID,
    graphDataArray: GraphDataArray;
    display: boolean;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    sheetDataArray: SheetData[];
    actions: Actions;
}): JSX.Element {

    // Log opening the graph sheet tab actions
    useEffect(() => {
        if (props.display) {
            void props.mitoAPI.log(
                'clicked_graph_sheet_tab_actions',
                {
                    graph_id: props.graphID
                }
            )
        }
    }, [props.display])

    const onDelete = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();

        await deleteGraphs([props.graphID], props.mitoAPI, props.setUIState, props.graphDataArray)
    }

    const onDuplicate = async (): Promise<void> => {
        // Close 
        props.closeOpenEditingPopups();
        
        // Duplicate the graph
        await openGraphSidebar(
            props.setUIState,
            props.uiState, 
            props.setEditorState,
            props.sheetDataArray, 
            props.mitoAPI,
            {
                type: 'new_duplicate_graph',
                graphIDToDuplicate: props.graphID,
            }
        )
    }

    /* Rename helper, which requires changes to the sheet tab itself */
    const onRename = (): void => {
        props.setIsRename(true);
    }

    const openExportGraphTaskpaneDropdown = async (): Promise<void> => {
        const existingParams = await getParamsForExistingGraph(props.mitoAPI, props.graphID);

        if (existingParams === undefined) {
            return;
        }
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedTabType: 'graph',
                currOpenTaskpane: {
                    type: TaskpaneType.GRAPH, 
                    graphSidebarOpen: false,
                    openGraph: {
                        type: 'existing_graph',
                        graphID: props.graphID,
                        existingParams: existingParams
                    }
                },
            }
        })

        props.actions.buildTimeActions[ActionEnum.ExportGraphDropdown].actionFunction()
    }
    
    return (
        <Dropdown
            display={props.display}
            closeDropdown={() => {
                props.setUIState((prevUIState) => {
                    // If the dropdown is open, then close it. Otherwise, don't change the state. 
                    const display = typeof prevUIState.currOpenDropdown === 'object' 
                        && prevUIState.currOpenDropdown.type === 'footer-context-menu' 
                        && prevUIState.currOpenDropdown.graphID === props.graphID;
                    return {
                        ...prevUIState,
                        currOpenDropdown: display ? undefined : prevUIState.currOpenDropdown
                    }
                });
            }}
            width='small'
        >
            <DropdownItem
                title='Export'
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete setting the currOpenTaskpane
                    e?.stopPropagation()
                    void openExportGraphTaskpaneDropdown()
                }}
            />
            <DropdownSectionSeperator isDropdownSectionSeperator={true} />
            <DropdownItem 
                title='Duplicate'
                onClick={onDuplicate}
            />
            <DropdownItem 
                title='Rename'
                onClick={onRename}
                supressFocusSettingOnClose
            />
            <DropdownItem 
                title='Delete'
                onClick={(e) => {
                    // Stop propogation so that the onClick of the sheet tab div
                    // doesn't compete updating the uiState to the graphID that is getting deleted
                    e?.stopPropagation()
                    void onDelete()
                }}
            />
        </Dropdown>
    )
}
