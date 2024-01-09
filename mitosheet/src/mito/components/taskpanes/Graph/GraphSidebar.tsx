import React, { useEffect, useState } from 'react';
import { MitoAPI, getRandomId } from '../../../api/api';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import { useEffectOnUpdateEvent } from '../../../hooks/useEffectOnUpdateEvent';
import { AnalysisData, ColumnIDsMap, GraphDataDict, GraphID, GraphSidebarTab, SheetData, UIState, UserProfile } from '../../../types';
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { TaskpaneType } from '../taskpanes';
import GraphSidebarTabs from './GraphSidebarTabs';
import { getGraphParams } from './graphUtils';

// import css
import '../../../../../css/taskpanes/Graph/GraphSidebar.css';
import '../../../../../css/taskpanes/Graph/LoadingSpinner.css';
import { useEffectOnResizeElement } from '../../../hooks/useEffectOnElementResize';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import GraphExportTab from './GraphExportTab';
import GraphSetupTab from './GraphSetupTab';
import GraphStyleTab from './GraphStyleTab';


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
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    uiState: UIState;
    graphDataDict: GraphDataDict
    analysisData: AnalysisData
    mitoContainerRef: React.RefObject<HTMLDivElement>,
    userProfile: UserProfile
    graphSidebarTab?: GraphSidebarTab
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
    const [stepID, setStepID] = useState<string>(() => getRandomId());

    // We keep track of the graph data separately from the backend state so that 
    // the UI updates immediately, even though the backend takes a while to process.
    const [graphParams, setGraphParams] = useState(() => getGraphParams(props.graphDataDict, graphID, props.uiState.selectedSheetIndex, props.sheetDataArray))

    const dataSourceSheetIndex = graphParams.graphCreation.sheet_index
    const graphOutput = props.graphDataDict[graphID]?.graphOutput
    const graphTabName = props.graphDataDict[graphID]?.graphTabName;
    const [loading, setLoading] = useState<boolean>(false)

    const [selectedGraphSidebarTab, setSelectedGraphSidebarTab] = useState<GraphSidebarTab>(GraphSidebarTab.Setup)

    // If the graphSidebarTab changes to Export then update it. 
    // This occurs if the graph tab action is used.
    useEffect(() => {
        if (props.graphSidebarTab === GraphSidebarTab.Export) {
            setSelectedGraphSidebarTab(props.graphSidebarTab)
        }
    }, [props.graphSidebarTab])

    /* 
        When graphUpdatedNumber is updated, we send a new getGraphMessage with the current graphParams
        in order to update the graphDataDict. We only increment graphUpdatedNumber when the user updates the params.

        We use this method instead of using a useEffect on the graphParams because the graphParams update when we don't want
        to sendGraphMessage, ie: during an Undo. 
    */
    const [graphUpdatedNumber, setGraphUpdatedNumber] = useState(0)

    // We log if plotly is not defined
    useEffect(() => {
        if (!(window as any).Plotly) {
            void props.mitoAPI.log('plotly_define_failed');
        }
    }, [])

    // Whenever the graph is resized, we update it (so it resizes as well)
    useEffectOnResizeElement(() => {
        setGraphUpdatedNumber(old => old + 1)
    }, [], props.mitoContainerRef, '#mito-center-content-container')

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
        setStepID(getRandomId())
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
        
        await props.mitoAPI.editGraph(
            graphID,
            graphParams,
            `300px`,
            `300px`,
            stepID
        );

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
            <DefaultTaskpane>
                <DefaultTaskpaneHeader
                    header='Graph' // TODO: change this to the tab name
                    setUIState={props.setUIState}
                />
                <DefaultTaskpaneBody>
                    {selectedGraphSidebarTab === GraphSidebarTab.Setup && 
                        <GraphSetupTab 
                            graphParams={graphParams}
                            setGraphParams={setGraphParams}
                            setGraphUpdatedNumber={setGraphUpdatedNumber}
                            uiState={props.uiState}
                            mitoAPI={props.mitoAPI}
                            sheetDataArray={props.sheetDataArray}
                            dfNames={props.dfNames}
                            columnDtypesMap={props.sheetDataArray[dataSourceSheetIndex]?.columnDtypeMap || {}}
                            columnIDsMapArray={props.columnIDsMapArray}
                            setUIState={props.setUIState}
                        />
                    }
                    {selectedGraphSidebarTab === GraphSidebarTab.Style &&
                        <GraphStyleTab 
                            graphParams={graphParams}
                            setGraphParams={setGraphParams}
                            setGraphUpdatedNumber={setGraphUpdatedNumber}
                            userProfile={props.userProfile}
                        />
                    }
                    {selectedGraphSidebarTab === GraphSidebarTab.Export && 
                        <GraphExportTab 
                            graphTabName={graphTabName}
                            graphParams={graphParams}
                            mitoAPI={props.mitoAPI}
                            loading={loading}
                            graphOutput={graphOutput}
                            mitoContainerRef={props.mitoContainerRef}
                        />
                    }
                </DefaultTaskpaneBody>
                <DefaultTaskpaneFooter>
                    <GraphSidebarTabs
                        selectedTab={selectedGraphSidebarTab}
                        setSelectedGraphSidebarTab={setSelectedGraphSidebarTab}
                        mitoAPI={props.mitoAPI}
                    />
                </DefaultTaskpaneFooter>
            </DefaultTaskpane>
        )
    }
};

export default GraphSidebar;
