import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import XIcon from '../../icons/XIcon';
import AxisSection, { GraphAxisType } from './AxisSection';
import LoadingSpinner from './LoadingSpinner';
import { TaskpaneType } from '../taskpanes';
import useDelayedAction from '../../../hooks/useDelayedAction';
import Select from '../../elements/Select';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';
import TextButton from '../../elements/TextButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { intersection } from '../../../utils/arrays';
import { ColumnID, ColumnIDsMap, GraphDataJSON, GraphParams, SheetData, UIState } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';

// import css
import '../../../../css/taskpanes/Graph/GraphSidebar.css'
import '../../../../css/taskpanes/Graph/LoadingSpinner.css'
import DefaultEmptyTaskpane from '../DefaultTaskpane/DefaultEmptyTaskpane';
import { isNumberDtype } from '../../../utils/dtypes';
import Toggle from '../../elements/Toggle';

export enum GraphType {
    SCATTER = 'scatter',
    BAR = 'bar',
    HISTOGRAM = 'histogram',
    BOX = 'box',
}

// The response from the backend should include each of these components
export interface GraphObject {
    html: string;
    script: string;
    generation_code: string;
}


// Millisecond delay between loading graphs, so that
// we don't load to many graphs when the user is clicking around
const LOAD_GRAPH_TIMEOUT = 1000;

// Graphing a dataframe with more than this number of rows will
// give the user the option to apply the safety filter
// Note: This must be kept in sync with the graphing heuristic in the mitosheet/graph folder
const GRAPH_SAFETY_FILTER_CUTOFF = 1000;

// Tooltips used to explain the Safety filter toggle
const SAFETY_FILTER_DISABLED_MESSAGE = `Because you’re graphing less than ${GRAPH_SAFETY_FILTER_CUTOFF} rows of data, you can safely graph your data without applying a filter first.`
const SAFETY_FILTER_ENABLED_MESSAGE = `Turning on Filter to Safe Size only graphs the first ${GRAPH_SAFETY_FILTER_CUTOFF} rows of your dataframe, ensuring that your browser tab won’t crash. Turning off Filter to Safe Size graphs the entire dataframe and may slow or crash your browser tab.`

// Helper function for creating default graph params 
const getDefaultGraphParams = (sheetDataArray: SheetData[], sheetIndex: number): GraphParams => {
    const safetyFilter = getDefaultSafetyFilter(sheetDataArray, sheetIndex)
    return {
        graphPreprocessing: {
            safety_filter_turned_on_by_user: safetyFilter
        },
        graphCreation: {
            graph_type: GraphType.BAR,
            sheet_index: sheetIndex,
            x_axis_column_ids: [],
            y_axis_column_ids: [],
        },
        graphStyling: undefined,
        graphRendering: {}
    }
}

// Helper function for getting the default safety filter status
const getDefaultSafetyFilter = (sheetDataArray: SheetData[], sheetIndex: number): boolean => {
    return sheetDataArray[sheetIndex] === undefined || sheetDataArray[sheetIndex].numRows > GRAPH_SAFETY_FILTER_CUTOFF
}

/*
    A helper function for getting the params for the graph fpr this sheet when
    opening the graphing taskpane, or when switching to a sheet.

    Notably, will filter oout any columns that are no longer in the dataset, 
    which stops the user from having invalid columns selected in their graph
    params.
*/
const getGraphParams = (   
    graphDataJSON: GraphDataJSON,
    sheetIndex: number,
    sheetDataArray: SheetData[],
): GraphParams => {
    const graphParams = graphDataJSON[sheetIndex]?.graphParams;
    if (graphParams !== undefined) {
        // Filter out column headers that no longer exist
        const validColumnIDs = sheetDataArray[sheetIndex] !== undefined ? sheetDataArray[sheetIndex].data.map(c => c.columnID) : [];
        const xAxisColumnIDs = intersection(
            validColumnIDs,
            graphParams.graphCreation.x_axis_column_ids
        )
        const yAxisColumnIDs = intersection(
            validColumnIDs,
            graphParams.graphCreation.y_axis_column_ids
        )
        return {
            ...graphParams,
            graphCreation: {
                ...graphParams.graphCreation,
                x_axis_column_ids: xAxisColumnIDs,
                y_axis_column_ids: yAxisColumnIDs
            }
        }
    }
    return getDefaultGraphParams(sheetDataArray, sheetIndex);
}


/*
    This is the main component that displays all graphing
    functionality, allowing the user to build and view graphs.
*/
const GraphSidebar = (props: {
    sheetDataArray: SheetData[];
    columnIDsMapArray: ColumnIDsMap[],
    dfNames: string[];
    graphSidebarSheet: number;
    columnDtypesMap: Record<string, string>;
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    graphDataJSON: GraphDataJSON
}): JSX.Element => {

    // We keep track of the graph data separately from the backend state so that 
    // the UI updates imidietly, even though the backend takes a while to process.
    const [graphParams, setGraphParams] = useState<GraphParams>(getGraphParams(props.graphDataJSON, props.graphSidebarSheet, props.sheetDataArray))
    const graphScript = props.graphDataJSON[props.graphSidebarSheet.toString()]?.graphScript
    const graphHTML = props.graphDataJSON[props.graphSidebarSheet.toString()]?.graphHTML
    console.log(graphScript, graphHTML)

    const [_copyGraphCode, graphCodeCopied] = useCopyToClipboard(props.graphDataJSON[props.graphSidebarSheet]?.graphGeneratedCode || '');

    const [loading, setLoading] = useState<boolean>(false)
    const [changeLoadingGraph] = useDelayedAction(LOAD_GRAPH_TIMEOUT)

    // If the graph has non-default params, then it has been configured
    const [graphHasNeverBeenConfigured, setGraphHasNeverBeenConfigured] = useState<boolean>(
        graphParams === getDefaultGraphParams(props.sheetDataArray, props.graphSidebarSheet)
    )

    // We log when the graph has been opened
    useEffect(() => {
        void props.mitoAPI.sendLogMessage('opened_graph');
    }, []);

    /* 
        When the user changes the graph data configuration, we load the new graph. 
    
        It calls the loadNewGraph function which is on a delay, as to 
        not overload the backend with new graph creation requests.
    */
    useEffect(() => {
        // If the graph has never been configured, then don't display the loading indicator
        // or try to create the graph
        if (graphHasNeverBeenConfigured) {
            setGraphHasNeverBeenConfigured(false)
            return
        }
        // Start the loading icon as soon as the user makes a change to the graph
        setLoading(true)
        void loadNewGraph()
        
    }, [graphParams])

    // When we get a new graph script, we execute it here. This is a workaround
    // that is required because we need to make sure this code runs, which it does
    // not when it is a script tag inside innerHtml (which react does not execute
    // for safety reasons).
    useEffect(() => {
        try {
            if (graphScript === undefined) {
                return;
            }
            const executeScript = new Function(graphScript);
            executeScript()
        } catch (e) {
            console.error("Failed to execute graph function", e)
        }

    }, [graphScript])

    /* 
        This is the actual function responsible for loading the new
        graph from the backend, making sure this graph is the correct
        size.
    */
    const getGraphAsync = async () => {
        const boundingRect: DOMRect | undefined = document.getElementById('graph-div')?.getBoundingClientRect();

        if (boundingRect !== undefined) {
            await props.mitoAPI.sendGraphMessage(
                graphParams.graphCreation.graph_type,
                graphParams.graphCreation.sheet_index,
                graphParams.graphPreprocessing.safety_filter_turned_on_by_user,
                graphParams.graphCreation.x_axis_column_ids,
                graphParams.graphCreation.y_axis_column_ids,
                `${boundingRect?.height - 10}px`, `${boundingRect?.width - 20}px` // Subtract pixels from the height & width to account for padding
            );

        }

        // Turn off the loading icon once the user get their graph back
        setLoading(false);
    }

    /* 
        Whenever the graph is changed we set a timeout to start loading a new 
        graph. This runs after LOAD_GRAPH_TIMEOUT.
    
        This makes sure we don't send unnecessary messages to the backend if the user
        is switching axes/graph types quickly.
    */
    const loadNewGraph = async () => {
        changeLoadingGraph(getGraphAsync);
    }

    // Toggles the safety filter component of the graph params
    const toggleSafetyFilter = (): void => {
        const newSafetyFilter = !graphParams.graphPreprocessing.safety_filter_turned_on_by_user

        setGraphParams({
            ...graphParams,
            graphPreprocessing: {
                safety_filter_turned_on_by_user: newSafetyFilter
            }
        })
    }

    const removeNonNumberColumnIDs = (columnIDs: ColumnID[]) => {
        const filteredColumnIDs = columnIDs.filter(columnID => {
            return isNumberDtype(props.columnDtypesMap[columnID])
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
            if (graphParams.graphCreation.x_axis_column_ids.length > 0 && graphParams.graphCreation.y_axis_column_ids.length > 0) {
                yAxisColumnIDsCopy = []
            }
        }

        // Log that we reset the selected columns
        if (xAxisColumnIDsCopy.length !== graphParams.graphCreation.x_axis_column_ids.length || 
            yAxisColumnIDsCopy.length !== graphParams.graphCreation.y_axis_column_ids.length) {
            void props.mitoAPI.sendLogMessage('reset_graph_columns_on_graph_type_change');
        }

        // Log that the user switched graph types
        void props.mitoAPI.sendLogMessage('switched_graph_type', {
            'graph_type': graphType,
            'x_axis_column_ids': xAxisColumnIDsCopy,
            'y_axis_column_ids': yAxisColumnIDsCopy,
        });

        // Update the graph type
        setGraphParams({
            ...graphParams,
            graphCreation: {
                graph_type: graphType,
                sheet_index: graphParams.graphCreation.sheet_index,
                x_axis_column_ids: xAxisColumnIDsCopy,
                y_axis_column_ids: yAxisColumnIDsCopy
            }
        })
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
                return {
                    ...prevGraphParams,
                    graphCreation: {
                        ...prevGraphParams.graphCreation, 
                        x_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        } else {
            setGraphParams(prevGraphParams => {
                return {
                    ...prevGraphParams,
                    graphCreation: {
                        ...prevGraphParams.graphCreation, 
                        y_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        }
    }

    const copyGraphCode = () => {
        _copyGraphCode()

        // Log that the user copied the graph code
        void props.mitoAPI.sendLogMessage('copy_graph_code', {
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
                    {graphHTML === undefined && graphParams.graphCreation.x_axis_column_ids?.length === 0 && graphParams.graphCreation.y_axis_column_ids?.length === 0 &&
                        <p className='graph-sidebar-welcome-text' >To generate a graph, select a axis.</p>
                    }
                    {graphHTML !== undefined &&
                        <div dangerouslySetInnerHTML={{ __html: graphHTML }} />
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
                                            currOpenTaskpane: { type: TaskpaneType.NONE }
                                        }
                                    })
                                    void props.mitoAPI.sendLogMessage('closed_graph')
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
                                        setGraphParams(prevGraphParams => {
                                            return {
                                                ...prevGraphParams,
                                                graphCreation: {
                                                    ...prevGraphParams.graphCreation, 
                                                    sheetIndex: newIndex
                                                }
                                            }
                                        })
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
                                We use a key here to force the Axis Section to update when the user changes the xAxisColumnHeaders.
                                A key is required because react does not know that the object xAxisColumnHeaders changed in all cases. 
                                Particularly, when the user changes the xAxisColumnHeaders from [A, B, A] to [B, A] by 
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
                            disabled={loading || graphHTML === undefined || graphScript === undefined}
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