// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import { MitoAPI } from '../../api/api';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { EditorState, GraphDataArray, GraphID, SheetData, UIState } from '../../types';
import { focusGrid } from '../endo/focusUtils';

// import icons
import SelectedSheetTabDropdownIcon from '../icons/SelectedSheetTabDropdownIcon';
import UnselectedSheetTabDropdownIcon from '../icons/UnselectedSheetTabDropdownIcon';
import { TaskpaneInfo, TaskpaneType } from '../taskpanes/taskpanes';
import GraphIcon from '../icons/GraphIcon';
import SheetTabContextMenu from './SheetTabContextMenu';
import GraphSheetTabContextMenu from './GraphSheetContextMenu';
import { openGraphSidebar } from '../taskpanes/Graph/graphUtils';

type SheetTabProps = {
    tabName: string;
    tabIDObj: {tabType: 'data', sheetIndex: number} | {tabType: 'graph', graphID: GraphID};
    isSelectedTab: boolean;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    graphDataArray: GraphDataArray;
    sheetDataArray: SheetData[]
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>
    display: boolean;
    setDisplayContextMenu: (display: boolean) => void;
};

/*
    Component that displays a dataframe name at the bottom of the sheet, and
    furthermore renders the sheet actions if the sheet action dropdown is 
    clicked.
*/
export default function SheetTab(props: SheetTabProps): JSX.Element {
    // We only set this as open if it the currOpenSheetTabActions
    const [isRename, setIsRename] = useState<boolean>(false);
    const [newTabName, setNewTabName] = useState<string>(props.tabName);

    // Make sure that if we change the sheet tab name that is displayed, we default to 
    // the correct new name as well
    useEffect(() => {
        setNewTabName(props.tabName);
    }, [props.tabName])
    
    const onRename = async (): Promise<void> => {
        void props.closeOpenEditingPopups(); // First, make sure to close open editing popups

        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeRename(
                props.tabIDObj.sheetIndex,
                newTabName
            );
        } else {
            await props.mitoAPI.editGraphRename(
                props.tabIDObj.graphID,
                newTabName
            )
        }
        
        props.setDisplayContextMenu(false);
        setIsRename(false);

        // Focus back on the grid
        const endoGridContainer = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
        focusGrid(endoGridContainer)
    }

    // If there is a dataRecon set, highlight the sheet tabs that are created or modified
    const createdSheetTab = props.uiState.dataRecon?.created_dataframe_names.includes(props.tabName)
    const modifiedSheetTab = Object.keys((props.uiState.dataRecon?.modified_dataframes_recons || {})).includes(props.tabName)

    return (
        <div 
            className={classNames(
                'tab', 
                {'tab-graph': props.tabIDObj.tabType === 'graph'}, 
                {'tab-selected': props.isSelectedTab},
                'cursor-pointer',
                {'tab-created-recon': createdSheetTab},
                {'tab-modified-recon': modifiedSheetTab},
                
            )} 
            onClick={() => {

                if (props.tabIDObj.tabType === 'graph') {
                    // If opening a graph tab, close the cell editor 
                    props.setEditorState(undefined);
                    const graphID = props.tabIDObj.graphID;
                    void openGraphSidebar(props.setUIState, props.uiState, props.setEditorState, props.sheetDataArray, props.mitoAPI, {type: 'open_existing_graph', 'graphID': graphID});
                }
                
                if (props.tabIDObj.tabType === 'data') {
                    const sheetIndex = props.tabIDObj.sheetIndex;
                    props.setUIState(prevUIState => {
                        // If the user clicks on a data sheet tab, switch to it and make sure the graph taskpane is not open
                        const taskpaneInfo: TaskpaneInfo = prevUIState.currOpenTaskpane.type === TaskpaneType.GRAPH ? 
                            {type: TaskpaneType.NONE} : prevUIState.currOpenTaskpane

                        return {
                            ...prevUIState,
                            selectedTabType: 'data',
                            selectedSheetIndex: sheetIndex,
                            currOpenTaskpane: taskpaneInfo
                        }
                    })
                }
            }} 
            onDoubleClick={() => {setIsRename(true)}} 
            onContextMenu={(e) => {
                if (e.shiftKey) {
                    return;
                }

                // If the user right clicks, show the dropdown for the sheet tabs
                e.preventDefault();
                props.setDisplayContextMenu(true);
            }}
        >
            <div className='tab-content'>
                {props.tabIDObj.tabType === 'graph' &&
                    /* Put it inside a div so everything is spaced correctly */
                    <div className='mr-3px'>
                        <GraphIcon isToolbar={false} variant={props.isSelectedTab ? 'light' : undefined}/>
                    </div>
                }
                {isRename && 
                    <form 
                        onSubmit={async (e) => {e.preventDefault(); await onRename()}}
                        onBlur={onRename}
                    >
                        <Input 
                            value={newTabName} 
                            onChange={(e) => {setNewTabName(e.target.value)}}
                            autoFocus
                            onEscape={() => {
                                setIsRename(false);
                                setNewTabName(props.tabName);
                            }}
                        />
                    </form>
                }
                {!isRename &&
                    <p>
                        {props.tabName} 
                    </p>
                }
                {/* Display the dropdown that allows a user to perform some action */}
                <div 
                    onClick={() => {props.setDisplayContextMenu(true)}}
                >
                    {props.isSelectedTab ? <SelectedSheetTabDropdownIcon /> : <UnselectedSheetTabDropdownIcon />}
                </div>
            </div>
            {props.tabIDObj.tabType === 'data' &&
                <SheetTabContextMenu 
                    setDisplayContextMenu={props.setDisplayContextMenu}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    sheetIndex={props.tabIDObj.sheetIndex}
                    mitoAPI={props.mitoAPI}
                    graphDataArray={props.graphDataArray}
                    sheetDataArray={props.sheetDataArray}
                    display={props.display}
                />
            }
            {props.tabIDObj.tabType === 'graph' &&
                <GraphSheetTabContextMenu 
                    setDisplayActions={props.setDisplayContextMenu}
                    setUIState={props.setUIState}
                    uiState={props.uiState}
                    sheetDataArray={props.sheetDataArray}
                    setEditorState={props.setEditorState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    graphID={props.tabIDObj.graphID}
                    mitoAPI={props.mitoAPI}
                    graphDataArray={props.graphDataArray}
                    display={props.display}
                />
            }
        </div>
    );
}
