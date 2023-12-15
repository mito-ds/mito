// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import { MitoAPI } from '../../api/api';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { DFSource, EditorState, GraphDataDict, GraphID, SheetData, UIState } from '../../types';
import { focusGrid } from '../endo/focusUtils';

// import icons
import SelectedSheetTabDropdownIcon from '../icons/SelectedSheetTabDropdownIcon';
import UnselectedSheetTabDropdownIcon from '../icons/UnselectedSheetTabDropdownIcon';
import { TaskpaneInfo, TaskpaneType } from '../taskpanes/taskpanes';
import { ModalEnum } from '../modals/modals';
import GraphIcon from '../icons/GraphIcon';
import SheetTabContextMenu from './SheetTabContextMenu';
import GraphSheetTabActions from './GraphSheetTabActions';

export const selectPreviousGraphSheetTab = (
    graphDataDict: GraphDataDict, 
    prevGraphIndex: number,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
): GraphID | undefined => {
    /*
        Try to select the graph that is at the same index as the previous graph.
        If no graph exists at that index, then select the graph at the previous index.
        If there are no graphs, then select the last sheet index
    */
    const graphIDs = Object.keys(graphDataDict || {})

    let newGraphID: GraphID | undefined = undefined 
    if (graphIDs.length > prevGraphIndex) {
        // If the the number of graphIDs is larger than the prevGraphIndex, 
        // then a new graphID is at the prevGraphIndex
        newGraphID = graphIDs[prevGraphIndex]
    } else if (graphIDs.length > 0) {
        // Otherwise if the prevGraphIndex was the highest index graphID 
        // and there is another graph, get the previous index
        newGraphID = graphIDs[prevGraphIndex - 1]
    } 

    if (newGraphID !== undefined) {
        // If there is a graph, then keep displaying graphs, otherwise display a data tab
        // Safely mark as GraphID because of the check above that the compiler is unable to understand
        const _newGraphID: GraphID = newGraphID

        setUIState((prevUIState) => {
            return {
                ...prevUIState,
                selectedGraphID: _newGraphID,
                selectedTabType: 'graph',
                currOpenTaskpane: {type: TaskpaneType.GRAPH, graphID: _newGraphID}
            }
        })

        return _newGraphID
    } else {
        // If there are no more graphs, close the graph taskpane and display a data sheet instead
        setUIState((prevUIState) => {
            return {
                ...prevUIState,
                selectedGraphID: undefined,
                selectedTabType: 'data',
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })

        return undefined
    }
}

type SheetTabProps = {
    tabName: string;
    tabIDObj: {tabType: 'data', sheetIndex: number} | {tabType: 'graph', graphID: GraphID};
    isSelectedTab: boolean;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    graphDataDict: GraphDataDict;
    sheetDataArray: SheetData[]
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>
    dfSources: DFSource[]
};

/*
    Component that displays a dataframe name at the bottom of the sheet, and
    furthermore renders the sheet actions if the sheet action dropdown is 
    clicked.
*/
export default function SheetTab(props: SheetTabProps): JSX.Element {
    // We only set this as open if it the currOpenSheetTabActions
    const [displayActions, setDisplayActions] = useState(false);
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
        
        setDisplayActions(false);
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
                    props.setEditorState(undefined)
                }
                
                props.setUIState(prevUIState => {
                    if (props.tabIDObj.tabType === 'data') {
                        // If the user clicks on a data sheet tab, switch to it and make sure the graph taskpane is not open
                        const taskpaneInfo: TaskpaneInfo = prevUIState.currOpenTaskpane.type === TaskpaneType.GRAPH ? 
                            {type: TaskpaneType.NONE} : prevUIState.currOpenTaskpane

                        return {
                            ...prevUIState,
                            selectedTabType: 'data',
                            selectedSheetIndex: props.tabIDObj.sheetIndex,
                            currOpenTaskpane: taskpaneInfo
                        }
                    } else {
                        return {
                            ...prevUIState,
                            selectedTabType: 'graph',
                            selectedGraphID: props.tabIDObj.graphID,
                            currOpenModal: {type: ModalEnum.None},
                            currOpenTaskpane: {
                                type: TaskpaneType.GRAPH,
                                graphID: props.tabIDObj.graphID
                            } 
                        }
                    }
                })
            }} 
            onDoubleClick={() => {setIsRename(true)}} 
            onContextMenu={(e) => {
                // If the user right clicks, show the dropdown for the sheet tabs
                e.preventDefault();
                setDisplayActions(true);
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
                    onClick={() => {setDisplayActions(true)}}
                >
                    {props.isSelectedTab ? <SelectedSheetTabDropdownIcon /> : <UnselectedSheetTabDropdownIcon />}
                </div>
            </div>
            {props.tabIDObj.tabType === 'data' &&
                <SheetTabContextMenu 
                    setDisplayActions={setDisplayActions}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    sheetIndex={props.tabIDObj.sheetIndex}
                    mitoAPI={props.mitoAPI}
                    graphDataDict={props.graphDataDict}
                    sheetDataArray={props.sheetDataArray}
                    display={displayActions && props.tabIDObj.tabType === 'data'}
                    dfSources={props.dfSources}
                />
            }
            {props.tabIDObj.tabType === 'graph' &&
                <GraphSheetTabActions 
                    setDisplayActions={setDisplayActions}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    graphID={props.tabIDObj.graphID}
                    mitoAPI={props.mitoAPI}
                    graphDataDict={props.graphDataDict}
                    display={displayActions && props.tabIDObj.tabType === 'graph'}
                />
            }
        </div>
    );
}
