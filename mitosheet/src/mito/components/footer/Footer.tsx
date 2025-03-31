/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';
import SheetTab from './SheetTab';

// import css
import "../../../../css/footer.css";
import { MitoAPI } from '../../api/api';
import { EditorState, GraphDataArray, GridState, SheetData, UIState } from '../../types';
import { Actions } from '../../utils/actions';
import { classNames } from '../../utils/classNames';
import PlusIcon from '../icons/PlusIcon';
import { TaskpaneType } from '../taskpanes/taskpanes';

type FooterProps = {
    sheetDataArray: SheetData[];
    graphDataArray: GraphDataArray;
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    mitoAPI: MitoAPI;
    closeOpenEditingPopups: () => void;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    actions: Actions;
};

/*
    Wrapper component that displays the entire footer of the sheet, including
    the sheet tabs, as well as the shape of the currently selected dataframe.
*/
function Footer(props: FooterProps): JSX.Element {

    const selectedSheetIndex = props.uiState.selectedSheetIndex
    const selectedGraphID = props.uiState.currOpenTaskpane.type === TaskpaneType.GRAPH ? props.uiState.currOpenTaskpane.openGraph.graphID : undefined;
    const selectedTabType = props.uiState.selectedTabType
    const displayContextMenuForIndex = (typeof props.uiState.currOpenDropdown === 'object' && props.uiState.currOpenDropdown.type === 'footer-context-menu') ? props.uiState.currOpenDropdown.sheetIndex : null;
    const setDisplayContextMenuForIndex = (index: number | null) => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenDropdown: index === null ? undefined : {
                    type: 'footer-context-menu',
                    sheetIndex: index
                }
            }
        })
    }

    // Get the sheet index to display the rows and columns of. 
    // If the sheet tab is a graph, then display the info from the data being graphed 
    const sheetIndex = selectedSheetIndex
    const sheetData: SheetData | undefined = props.sheetDataArray[sheetIndex]

    const disabledDueToReplayAnalysis = props.uiState.currOpenTaskpane.type === TaskpaneType.UPDATEIMPORTS && props.uiState.currOpenTaskpane.failedReplayData !== undefined;

    return (
        <div className='footer'>
            <div
                className={classNames('footer-add-button', 'cursor-pointer')}
                onClick={() => {
                    if (disabledDueToReplayAnalysis) {
                        return;
                    }
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {type: TaskpaneType.IMPORT_FILES}
                        }
                    })
                }}
            >
                <PlusIcon/>
            </div>
            <div className="footer-tab-bar scrollbar-gutter">
                {/* First add the data tabs, and then add the graph tabs */}
                {props.sheetDataArray.map(df => df.dfName).map((dfName, idx) => {
                    return (
                        <SheetTab
                            key={idx}
                            tabName={dfName}
                            actions={props.actions}
                            tabIDObj={{tabType: 'data', sheetIndex: idx}}
                            isSelectedTab={selectedTabType === 'data' && idx === selectedSheetIndex}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            mitoAPI={props.mitoAPI}
                            mitoContainerRef={props.mitoContainerRef}
                            graphDataArray={props.graphDataArray}
                            sheetDataArray={props.sheetDataArray}
                            setEditorState={props.setEditorState}
                            display={displayContextMenuForIndex === idx}
                            setDisplayContextMenu={(display: boolean) => {
                                if (display) {
                                    setDisplayContextMenuForIndex(idx);
                                } else {
                                    setDisplayContextMenuForIndex(null);
                                }
                            }}
                        />
                    )
                })}
                {props.graphDataArray.map((graphData) => {
                    return (
                        <SheetTab
                            key={graphData.graph_id}
                            tabName={graphData.graph_tab_name}
                            tabIDObj={{tabType: 'graph', graphID: graphData.graph_id}}
                            isSelectedTab={selectedTabType === 'graph' && graphData.graph_id === selectedGraphID}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                            mitoAPI={props.mitoAPI}
                            mitoContainerRef={props.mitoContainerRef}
                            graphDataArray={props.graphDataArray}
                            sheetDataArray={props.sheetDataArray}
                            setEditorState={props.setEditorState}
                            actions={props.actions}
                            display={typeof props.uiState.currOpenDropdown === 'object' && props.uiState.currOpenDropdown.type === 'footer-context-menu' && props.uiState.currOpenDropdown.graphID === graphData.graph_id}
                            setDisplayContextMenu={(display: boolean) => {
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenDropdown: display ? {
                                            type: 'footer-context-menu',
                                            graphID: graphData.graph_id
                                        } : undefined
                                    }
                                })
                            }}
                        />
                    )
                })}
            </div>

            {sheetData !== undefined && 
                <div className='footer-right-side'>
                    <div className='footer-sheet-shape'>
                        ({sheetData.numRows} rows, {sheetData.numColumns} cols)
                    </div>
                </div>
            }
        </div>
    );
}

export default Footer;
