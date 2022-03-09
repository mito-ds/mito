import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import XIcon from '../../icons/XIcon';
import AxisSection, { GraphAxisType } from './AxisSection';
import LoadingSpinner from './LoadingSpinner';
import { TaskpaneType } from '../taskpanes';
import Select from '../../elements/Select';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { ColumnID, ColumnIDsMap, GraphDataJSON, GraphID, SheetData, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';

// import css
import '../../../../css/taskpanes/Graph/GraphSidebar.css'
import '../../../../css/taskpanes/Graph/LoadingSpinner.css'
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { isNumberDtype } from '../../../utils/dtypes';
import Toggle from '../../elements/Toggle';
import usePrevious from '../../../hooks/usePrevious';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import { getDefaultGraphParams, getDefaultSafetyFilter, getGraphParams } from './GraphUtils';

export enum GraphType {
    SCATTER = 'scatter',
    BAR = 'bar',
    HISTOGRAM = 'histogram',
    BOX = 'box',
}

// Millisecond delay between loading graphs, so that
// we don't load to many graphs when the user is clicking around
const LOAD_GRAPH_TIMEOUT = 1000;

// Graphing a dataframe with more than this number of rows will
// give the user the option to apply the safety filter
// Note: This must be kept in sync with the graphing heuristic in the mitosheet/graph folder
export const GRAPH_SAFETY_FILTER_CUTOFF = 1000;

// Tooltips used to explain the Safety filter toggle
const SAFETY_FILTER_DISABLED_MESSAGE = `Because you’re graphing less than ${GRAPH_SAFETY_FILTER_CUTOFF} rows of data, you can safely graph your data without applying a filter first.`
const SAFETY_FILTER_ENABLED_MESSAGE = `Turning on Filter to Safe Size only graphs the first ${GRAPH_SAFETY_FILTER_CUTOFF} rows of your dataframe, ensuring that your browser tab won’t crash. Turning off Filter to Safe Size graphs the entire dataframe and may slow or crash your browser tab.`

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
    graphDataJSON: GraphDataJSON
    lastStepIndex: number
    newGraphStepID?: string
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
    const [stepID, setStepID] = useState<string|undefined>(props.newGraphStepID);
    console.log('step id: ', stepID)

    // We keep track of the graph data separately from the backend state so that 
    // the UI updates immediately, even though the backend takes a while to process.
    const [graphParams, setGraphParams] = useState(() => getGraphParams(props.graphDataJSON, graphID, props.uiState.selectedSheetIndex, props.sheetDataArray))

    const dataSourceSheetIndex = graphParams.graphCreation.sheet_index
    const graphOutput = props.graphDataJSON[graphID]?.graphOutput
    const [_copyGraphCode, graphCodeCopied] = useCopyToClipboard(graphOutput?.graphGeneratedCode);
    const [loading, setLoading] = useState<boolean>(false)

    /* 
        When graphUpdatedNumber is, we send a new getGraphMessage with the current graphParams
        in order to update the graphDataJSON. We only increment graphUpdatedNumber when the user updates the params.

        We use this method instead of using a useEffect on the graphParams because the graphParams update when we don't want
        to sendGraphMessage, ie: during an Undo. 

        We use this method of graphUpdatedNumber to simulate a callback to updating the graphParams because we can't pass a callback to 
        the setGraphParams (since its created via a useState instead of this.setState on a class component). Usually, we would use a useEffect on 
        graphParams to act as the callback, but for the reasons described above, that is not the approach we take here. 
    */
    const [graphUpdatedNumber, setGraphUpdatedNumber] = useState(0)

    // Save the last step index, so that we can check if an undo occured
    const prevLastStepIndex = usePrevious(props.lastStepIndex);

    // When the last step index changes, check if an undo occured so we can refresh the params
    useEffect(() => {
        // If there has been an undo, then we refresh the params to this pivot
        if (prevLastStepIndex && prevLastStepIndex !== props.lastStepIndex - 1) {
            void refreshParamsAfterUndo()
        }
    }, [props.lastStepIndex])

    /*
        If the props.graphID changes, which happens when opening a graph (either switching between graph tabs or duplicating a graph):
        1. reset the stepID so we don't overwrite the previous edits.
        2. refresh the graphParams so the UI is up to date with the new graphID's configuration.
        3. update the graphUpdateNumber so the graph refreshes
    */
    useEffect(() => {
        // Only reset when we're not creating a graph for the first time 
        if (props.newGraphStepID === undefined) {
            setStepID(undefined)
            setGraphParams(getGraphParams(props.graphDataJSON, props.graphID, props.uiState.selectedSheetIndex, props.sheetDataArray))
            setGraphUpdatedNumber(old => old + 1)
        }
    }, [props.graphID])

    // Async load in the data from the mitoAPI
    useDebouncedEffect(() => {
        /* 
            Send the graph message even if the user has not yet configured the graph so that: 
            1) the graph is updated if the data changes since the graph was last updated
            2) the new graph tab is created in the toolbar as soon as the graph taskpane opens
        */
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
        const boundingRect: DOMRect | undefined = document.getElementById('graph-div')?.getBoundingClientRect();

        if (boundingRect !== undefined) {
            const _stepID = await props.mitoAPI.editGraph(
                graphID,
                graphParams.graphCreation.graph_type,
                graphParams.graphCreation.sheet_index,
                graphParams.graphPreprocessing.safety_filter_turned_on_by_user,
                graphParams.graphCreation.x_axis_column_ids,
                graphParams.graphCreation.y_axis_column_ids,
                `${boundingRect?.height - 10}px`, 
                `${boundingRect?.width - 20}px`, // Subtract pixels from the height & width to account for padding
                stepID, 
            );
            setStepID(_stepID)
        }

        // Turn off the loading icon once the user get their graph back
        setLoading(false);
    }

    /*
        Updates the graph params on undo so that the graph configuration is in sync
        with the graph shown
    */
    const refreshParamsAfterUndo = async (): Promise<void> => {        
        const newGraphParams = getGraphParams(props.graphDataJSON, graphID, dataSourceSheetIndex, props.sheetDataArray)
        setGraphParams(newGraphParams)
    } 

    // Toggles the safety filter component of the graph params
    const toggleSafetyFilter = (): void => {
        const newSafetyFilter = !graphParams.graphPreprocessing.safety_filter_turned_on_by_user

        setGraphParams(prevGraphParams => {
            const copyPrevGraphParams = {...prevGraphParams}
            return {
                ...copyPrevGraphParams,
                graphPreprocessing: {
                    safety_filter_turned_on_by_user: newSafetyFilter
                }
            }
        })
        setGraphUpdatedNumber((old) => old + 1);
    }

    const removeNonNumberColumnIDs = (columnIDs: ColumnID[]) => {
        const filteredColumnIDs = columnIDs.filter(columnID => {
            return props.columnDtypesMap !== undefined && isNumberDtype(props.columnDtypesMap[columnID])
        })
        return filteredColumnIDs
    }

    const setGraphType = (graphType: GraphType) => {
        let xAxisColumnIDsCopy = [...graphParams.graphCreation.x_axis_column_ids]
        let yAxisColumnIDsCopy = [...graphParams.graphCreation.y_axis_column_ids]

        /* 
            If the user switches to a Box plot or Histogram, then we make sure that
            1. all of the selected columns are numbers. 
            2. there are not columns in both the x and y axis. 
        */
        if (graphType === GraphType.BOX || graphType === GraphType.HISTOGRAM) {
            xAxisColumnIDsCopy = removeNonNumberColumnIDs(xAxisColumnIDsCopy)
            yAxisColumnIDsCopy = removeNonNumberColumnIDs(yAxisColumnIDsCopy)

            // Make sure that only one axis has selected column headers. 
            if (xAxisColumnIDsCopy.length > 0 && yAxisColumnIDsCopy.length > 0) {
                yAxisColumnIDsCopy = []
            }
        }

        // Log that we reset the selected columns
        if (xAxisColumnIDsCopy.length !== graphParams.graphCreation.x_axis_column_ids.length || 
            yAxisColumnIDsCopy.length !== graphParams.graphCreation.y_axis_column_ids.length) {
            void props.mitoAPI.log('reset_graph_columns_on_graph_type_change');
        }

        // Log that the user switched graph types
        void props.mitoAPI.log('switched_graph_type', {
            'graph_type': graphType,
            'x_axis_column_ids': xAxisColumnIDsCopy,
            'y_axis_column_ids': yAxisColumnIDsCopy,
        });

        // Update the graph type
        setGraphParams(prevGraphParams => {
            const copyPrevGraphParams = {...prevGraphParams}
            return {
                ...copyPrevGraphParams,
                graphCreation: {
                    ...copyPrevGraphParams.graphCreation,
                    graph_type: graphType,
                    x_axis_column_ids: xAxisColumnIDsCopy,
                    y_axis_column_ids: yAxisColumnIDsCopy
                }
            }
        })
        setGraphUpdatedNumber((old) => old + 1);
    }

    /* 
        Function responsible for updating the selected column headers for each axis. 
        Set the columnHeader at the index of the graphAxis selected columns array.
    
        To remove a column, leave the columnHeader empty.
    */
    const updateAxisData = (graphAxis: GraphAxisType, index: number, columnID?: ColumnID) => {
        // Get the current axis data
        let axisColumnIDs: ColumnID[] = []
        if (graphAxis === GraphAxisType.X_AXIS) {
            axisColumnIDs = graphParams.graphCreation.x_axis_column_ids
        } else {
            axisColumnIDs = graphParams.graphCreation.y_axis_column_ids
        }

        // Make a copy of the column headers before editing them
        const axisColumnIDsCopy = [...axisColumnIDs]

        if (columnID === undefined) {
            axisColumnIDsCopy.splice(index, 1)
        } else {
            axisColumnIDsCopy[index] = columnID
        }

        // Update the axis data
        if (graphAxis === GraphAxisType.X_AXIS) {
            setGraphParams(prevGraphParams => {
                const copyPrevGraphParams = {...prevGraphParams}
                return {
                    ...copyPrevGraphParams,
                    graphCreation: {
                        ...copyPrevGraphParams.graphCreation, 
                        x_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        } else {
            setGraphParams(prevGraphParams => {
                const copyPrevGraphParams = {...prevGraphParams}
                return {
                    ...copyPrevGraphParams,
                    graphCreation: {
                        ...copyPrevGraphParams.graphCreation, 
                        y_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        }

        // Then set increment graphUpdateNumber so we send the graph message
        setGraphUpdatedNumber((old) => old + 1);
    }

    const copyGraphCode = () => {
        _copyGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.log('copy_graph_code', {
            'graph_type': graphParams.graphCreation.graph_type
        });
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
                <div className='graph-sidebar-toolbar-div'>
                    <Row justify='space-between' align='center'>
                        <Col>
                            <p className='text-header-2'>
                                Generate Graph
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
                                    void props.mitoAPI.log('closed_graph')
                                }}
                            />
                        </Col>
                    </Row>
                    <div className='graph-sidebar-toolbar-content'>
                        <Row justify='space-between' align='center'>
                            <Col>
                                <p className='text-header-3'>
                                    Data Source
                                </p>
                            </Col>
                            <Col>
                                <Select
                                    value={props.dfNames[graphParams.graphCreation.sheet_index]}
                                    onChange={(newDfName: string) => {
                                        const newIndex = props.dfNames.indexOf(newDfName);
                                        
                                        // Reset the graph params for the new sheet, but keep the graph type!
                                        const newSheetGraphParams = getDefaultGraphParams(props.sheetDataArray, newIndex, graphParams.graphCreation.graph_type)
                                        setGraphParams(newSheetGraphParams)

                                        setGraphUpdatedNumber((old) => old + 1);
                                    }}
                                    width='small'
                                >
                                    {props.dfNames.map(dfName => {
                                        return (
                                            <DropdownItem
                                                key={dfName}
                                                title={dfName}
                                            />
                                        )
                                    })}
                                </Select>
                            </Col>
                        </Row>
                        <Row justify='space-between' align='center'>
                            <Col>
                                <p className='text-header-3'>
                                    Chart Type
                                </p>
                            </Col>
                            <Col>
                                <Select
                                    value={graphParams.graphCreation.graph_type}
                                    onChange={(graphType: string) => {
                                        setGraphType(graphType as GraphType)
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={GraphType.BAR}
                                    />
                                    <DropdownItem
                                        title={GraphType.BOX}
                                        subtext='Only supports number columns'
                                    />
                                    <DropdownItem
                                        title={GraphType.HISTOGRAM}
                                        subtext='Only supports number columns'
                                    />
                                    <DropdownItem
                                        title={GraphType.SCATTER}
                                    />
                                </Select>
                            </Col>
                        </Row>

                        <AxisSection
                            /* 
                                We use a key here to force the Axis Section to update when the user changes the x_axis_column_ids.
                                A key is required because react does not know that the object x_axis_column_ids changed in all cases. 
                                Particularly, when the user changes the x_axis_column_ids from [A, B, A] to [B, A] by 
                                deleting the first A, React does not recognize that the change has occurred and so the Axis Section does 
                                not update even though the graph updates.
    
                                We append the indicator xAxis to the front of the list to ensure that both AxisSections have unique keys. 
                                When the Axis Sections don't have unique keys, its possible for the sections to become duplicated as per 
                                the React warnings.
                            */
                            key={['xAxis'].concat(graphParams.graphCreation.x_axis_column_ids).join('')}
                            columnIDsMap={props.columnIDsMapArray[graphParams.graphCreation.sheet_index]}
                            columnDtypesMap={props.columnDtypesMap}

                            graphType={graphParams.graphCreation.graph_type}
                            graphAxis={GraphAxisType.X_AXIS}
                            selectedColumnIDs={graphParams.graphCreation.x_axis_column_ids}
                            otherAxisSelectedColumnIDs={graphParams.graphCreation.y_axis_column_ids}

                            updateAxisData={updateAxisData}
                            mitoAPI={props.mitoAPI}
                        />
                        <AxisSection
                            // See note about keys for Axis Sections above.
                            key={['yAxis'].concat(graphParams.graphCreation.y_axis_column_ids).join('')}
                            columnIDsMap={props.columnIDsMapArray[graphParams.graphCreation.sheet_index]}
                            columnDtypesMap={props.columnDtypesMap}

                            graphType={graphParams.graphCreation.graph_type}
                            graphAxis={GraphAxisType.Y_AXIS}
                            selectedColumnIDs={graphParams.graphCreation.y_axis_column_ids}
                            otherAxisSelectedColumnIDs={graphParams.graphCreation.x_axis_column_ids}

                            updateAxisData={updateAxisData}
                            mitoAPI={props.mitoAPI}
                        />
                        <Row justify='space-between' align='center' title={getDefaultSafetyFilter(props.sheetDataArray, graphParams.graphCreation.sheet_index) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                            <Col>
                                <p className='text-header-3' >
                                    Filter to safe size
                                </p>
                            </Col>
                            <Col>
                                <Toggle
                                    value={graphParams.graphPreprocessing.safety_filter_turned_on_by_user}
                                    onChange={toggleSafetyFilter}
                                    disabled={!getDefaultSafetyFilter(props.sheetDataArray, graphParams.graphCreation.sheet_index)}
                                />
                            </Col>
                        </Row>

                    </div>

                    <div className='graph-sidebar-toolbar-code-export-button'>
                        <TextButton
                            variant='dark'
                            onClick={copyGraphCode}
                            disabled={loading || graphOutput === undefined}
                        >
                            {!graphCodeCopied
                                ? "Copy Graph Code"
                                : "Copied!"
                            }
                        </TextButton>
                    </div>
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
