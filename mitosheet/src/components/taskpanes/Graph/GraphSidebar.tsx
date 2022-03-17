import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import { useEffectOnUpdateEvent } from '../../../hooks/useEffectOnUpdateEvent';
import { AnalysisData, ColumnIDsMap, GraphDataDict, GraphID, GraphSidebarTab, SheetData, UIState } from '../../../types';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { TaskpaneType } from '../taskpanes';
import GraphSidebarTabs from './GraphSidebarTabs';
import LoadingSpinner from './LoadingSpinner';
import { getGraphParams } from './graphUtils';

// import css
import '../../../../css/taskpanes/Graph/GraphSidebar.css';
import '../../../../css/taskpanes/Graph/LoadingSpinner.css';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import XIcon from '../../icons/XIcon';
import GraphStyleTab from './GraphStyleTab';
import GraphSetupTab from './GraphSetupTab';
import GraphExportTab from './GraphExportTab';
import { useEffectOnResizeElement } from '../../../hooks/useEffectOnElementResize';


export enum GraphType {
    BAR = 'bar',
    LINE = 'line',
    SCATTER = 'scatter',
    HISTOGRAM = 'histogram',
    DENSITY_HEATMAP = 'density heatmap',
    DENSITY_CONTOUR = 'density contour',
    BOX = 'box',
    VIOLIN = 'violin',
    STRIP = 'strip',
    ECDF = 'ecdf',
}


// Millisecond delay between loading graphs, so that
// we don't load to many graphs when the user is clicking around
const LOAD_GRAPH_TIMEOUT = 1000;

/*
    This is the main component that displays all graphing
    functionality, allowing the user to build and view graphs.
*/
const GraphSidebar = (props: {
    sheetDataArray: SheetData[];
    columnIDsMapArray: ColumnIDsMap[],
    dfNames: string[];
    graphID: GraphID
    columnDtypesMap: Record<string, string>;
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    graphDataDict: GraphDataDict
    analysisData: AnalysisData
}): JSX.Element => {

    /*
        The graphID is the keystone of the graphSidebar. Each graph tab has one graphID that does not switch even if the user changes source data sheets. 
        
        In order to properly open a graph in Mito, there are a few things that need to occur:
            1. We need to update the uiState's `selectedTabType` to "graph" so that the footer selects the correct tab
            2. We need to set the uiState's `currTaskpaneOpen` to "graph" so that we actually display the graph
            3. We need to pass the current taskpane the graphID so that we know which graph to display.
        Everything else is handled by the graphSidebar.  

        To create a graph, we always pass a graphID. That means that if we're creating a new graph, the opener of the taskpane is required
        to create a new graphID. 
    */
    const graphID = props.graphID

    // Every configuration that the user makes with this graphID is the same step, until the graphID is changed.
    const [stepID, setStepID] = useState<string|undefined>(undefined);

    // We keep track of the graph data separately from the backend state so that 
    // the UI updates immediately, even though the backend takes a while to process.
    const [graphParams, setGraphParams] = useState(() => getGraphParams(props.graphDataDict, graphID, props.uiState.selectedSheetIndex, props.sheetDataArray))

    const dataSourceSheetIndex = graphParams.graphCreation.sheet_index
    const graphOutput = props.graphDataDict[graphID]?.graphOutput
    const [loading, setLoading] = useState<boolean>(false)
    const [selectedGraphSidebarTab, setSelectedGraphSidebarTab] = useState<GraphSidebarTab>(GraphSidebarTab.Setup)

    /* 
        When graphUpdatedNumber is updated, we send a new getGraphMessage with the current graphParams
        in order to update the graphDataDict. We only increment graphUpdatedNumber when the user updates the params.

        We use this method instead of using a useEffect on the graphParams because the graphParams update when we don't want
        to sendGraphMessage, ie: during an Undo. 
    */
    const [graphUpdatedNumber, setGraphUpdatedNumber] = useState(0)

    // Whenever the graph is resized, we update it (so it resizes as well)
    useEffectOnResizeElement(() => {
        setGraphUpdatedNumber(old => old + 1)
    }, [], 'mito-main-sheet-div')

    // If there has been an undo or redo, then we refresh the params to this graph
    useEffectOnUpdateEvent(() => {
        void refreshParams()
    }, props.analysisData)

    /*
        If the props.graphID changes, which happens when opening a graph:
        1. reset the stepID so we don't overwrite the previous edits.
        2. refresh the graphParams so the UI is up to date with the new graphID's configuration.
        3. update the graphUpdateNumber so the graph refreshes
    */
    useEffect(() => {
        setStepID(undefined)
        setGraphParams(getGraphParams(props.graphDataDict, props.graphID, props.uiState.selectedSheetIndex, props.sheetDataArray))
        setGraphUpdatedNumber(old => old + 1)
    }, [props.graphID])

    // Async load in the data from the mitoAPI
    useDebouncedEffect(() => {
        // Send the editGraph message when the graph is updated
        setLoading(true)
        void getGraphAsync()
    }, [graphUpdatedNumber], LOAD_GRAPH_TIMEOUT)


    // When we get a new graph ouput, we execute the graph script here. This is a workaround
    // that is required because we need to make sure this code runs, which it does
    // not when it is a script tag inside innerHtml (which react does not execute
    // for safety reasons).
    useEffect(() => {
        try {
            if (graphOutput === undefined) {
                return;
            }
            const executeScript = new Function(graphOutput.graphScript);
            executeScript()
        } catch (e) {
            console.error("Failed to execute graph function", e)
        }

    }, [graphOutput])

    /* 
        This is the actual function responsible for loading the new
        graph from the backend, making sure this graph is the correct
        size.
    */
    const getGraphAsync = async () => {
        // The reason that we use the mito-main-sheet-div instead of the graph-div is because the size of the graph div
        // changes depending on the size of the graph. Specifically, when exiting fullscreen mode, the graph-div is wider
        // than we actually have space for. 
        const boundingRect: DOMRect | undefined = document.getElementById('mito-main-sheet-div')?.getBoundingClientRect();

        if (boundingRect !== undefined) {
            const _stepID = await props.mitoAPI.editGraph(
                graphID,
                graphParams.graphCreation.graph_type,
                graphParams.graphCreation.sheet_index,
                graphParams.graphCreation.color,
                graphParams.graphPreprocessing.safety_filter_turned_on_by_user,
                graphParams.graphCreation.x_axis_column_ids,
                graphParams.graphCreation.y_axis_column_ids,
                `${boundingRect?.height - 10}px`, // Subtract pixels from the height & width to account for padding
                `${boundingRect?.width - 20 - 250}px`, // NOTE: 250 is the width of the graph sidebar. KEEP THIS UP TO DATE WITH THE CSS
                stepID
            );
            setStepID(_stepID)
        }

        // Turn off the loading icon once the user get their graph back
        setLoading(false);
    }

    /*
        Updates the graph params so that the graph configuration is in sync
        with the graph shown, which is useful in the case of an undo or redo
    */
    const refreshParams = async (): Promise<void> => {        
        const newGraphParams = getGraphParams(props.graphDataDict, graphID, dataSourceSheetIndex, props.sheetDataArray)
        setGraphParams(newGraphParams)
    } 

    if (props.sheetDataArray.length === 0) {
        // Since the UI for the graphing takes up the whole screen, we don't even let the user keep it open
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: { type: TaskpaneType.NONE }
            }
        })
        return <DefaultEmptyTaskpane setUIState={props.setUIState} />
    } else {
        return (
            <div className='graph-sidebar-div'>
                <div className='graph-sidebar-graph-div' id='graph-div' >
                    {graphOutput === undefined &&
                        <p className='graph-sidebar-welcome-text' >To generate a graph, select an axis.</p>
                    }
                    {graphOutput !== undefined &&
                        <div dangerouslySetInnerHTML={{ __html: graphOutput.graphHTML }} />
                    }
                </div>
                <div className='graph-sidebar-toolbar-container'>
                    <div className='graph-sidebar-toolbar-tab-container'>
                        <>
                            <Row justify='space-between' align='center'>
                                <Col>
                                    <p className='text-header-2'>
                                        {selectedGraphSidebarTab === GraphSidebarTab.Setup && 'Setup Graph'}
                                        {selectedGraphSidebarTab === GraphSidebarTab.Style && 'Style Graph'}
                                        {selectedGraphSidebarTab === GraphSidebarTab.Export && 'Export Graph'}
                                    </p>
                                </Col>
                                <Col>
                                    <XIcon
                                        onClick={() => {
                                            props.setUIState((prevUIState) => {
                                                return {
                                                    ...prevUIState,
                                                    selectedTabType: 'data',
                                                    currOpenTaskpane: { type: TaskpaneType.NONE }
                                                }
                                            })
                                        }}
                                    />
                                </Col>
                            </Row>
                            {selectedGraphSidebarTab === GraphSidebarTab.Setup && 
                                <GraphSetupTab 
                                    graphParams={graphParams}
                                    setGraphParams={setGraphParams}
                                    setGraphUpdatedNumber={setGraphUpdatedNumber}
                                    uiState={props.uiState}
                                    mitoAPI={props.mitoAPI}
                                    sheetDataArray={props.sheetDataArray}
                                    dfNames={props.dfNames}
                                    columnDtypesMap={props.columnDtypesMap}
                                    columnIDsMapArray={props.columnIDsMapArray}
                                    setUIState={props.setUIState}
                                />
                            }
                            {selectedGraphSidebarTab === GraphSidebarTab.Style &&
                                <GraphStyleTab />
                            }
                            {selectedGraphSidebarTab === GraphSidebarTab.Export && 
                                <GraphExportTab 
                                    graphParams={graphParams}
                                    mitoAPI={props.mitoAPI}
                                    loading={loading}
                                    graphOutput={graphOutput}
                                />
                            }
                        </>
                    </div>
                    <GraphSidebarTabs
                        selectedTab={selectedGraphSidebarTab}
                        setSelectedGraphSidebarTab={setSelectedGraphSidebarTab}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
                
                {loading &&
                    <div className='popup-div'>
                        <LoadingSpinner />
                        <p className='popup-text-div'>
                            loading
                        </p>
                    </div>
                }
            </div>
            
        )
    }
};

export default GraphSidebar;
