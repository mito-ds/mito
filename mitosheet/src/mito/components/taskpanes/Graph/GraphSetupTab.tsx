// Copyright (c) Mito

import React, { Fragment } from 'react';
import { MitoAPI } from '../../../api/api';
import { ColumnID, GraphID, GraphParamsFrontend, RecursivePartial, SheetData, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import DataframeSelect from '../../elements/DataframeSelect';
import DropdownItem from '../../elements/DropdownItem';
import Input from '../../elements/Input';
import LabelAndTooltip from '../../elements/LabelAndTooltip';
import Select from '../../elements/Select';
import Toggle from '../../elements/Toggle';
import Col from '../../layout/Col';
import CollapsibleSection from '../../layout/CollapsibleSection';
import Row from '../../layout/Row';
import AxisSection, { GraphAxisType } from './AxisSection';
import { getColorDropdownItems, getDefaultGraphParams, getDefaultSafetyFilter, getGraphTypeFullName } from './graphUtils';

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

// Graphing a dataframe with more than this number of rows will
// give the user the option to apply the safety filter
// Note: This must be kept in sync with the graphing heuristic in the mitosheet/graph folder
export const GRAPH_SAFETY_FILTER_CUTOFF = 1000;

// Tooltips used to explain the Safety filter toggle
const SAFETY_FILTER_DISABLED_MESSAGE = `Because you’re graphing less than ${GRAPH_SAFETY_FILTER_CUTOFF} rows of data, you can safely graph your data without applying a filter first.`
const SAFETY_FILTER_ENABLED_MESSAGE = `Turning on Limit ${GRAPH_SAFETY_FILTER_CUTOFF} rows only graphs the first ${GRAPH_SAFETY_FILTER_CUTOFF} rows of your dataframe, ensuring that your browser tab won’t crash. Turning it off graphs the entire dataframe and may slow or crash your browser tab.`

const GRAPHS_THAT_DONT_SUPPORT_COLOR = [GraphType.DENSITY_HEATMAP]

// These variables are used to populate the collapsible style section that is 
// specific to each graph type.
export const GRAPHS_THAT_HAVE_NBINS = [GraphType.HISTOGRAM]
export const GRAPHS_THAT_HAVE_BARMODE = [GraphType.BAR, GraphType.HISTOGRAM]
export const GRAPHS_THAT_HAVE_BARNORM = [GraphType.BAR, GraphType.HISTOGRAM]
export const GRAPHS_THAT_HAVE_HISTNORM = [GraphType.HISTOGRAM]
export const GRAPHS_THAT_HAVE_HISTFUNC = [GraphType.HISTOGRAM]
export const GRAPHS_THAT_HAVE_POINTS = [GraphType.BOX, GraphType.VIOLIN]
export const GRAPHS_THAT_HAVE_LINE_SHAPE = [GraphType.LINE]

// This variable is used to figure out which graph types should 
// havve teh specific graph type configuration section
export const GRAPHS_WITH_UNIQUE_CONFIG_OPTIONS = [...new Set([
    ...GRAPHS_THAT_HAVE_NBINS,
    ...GRAPHS_THAT_HAVE_BARMODE, 
    ...GRAPHS_THAT_HAVE_BARNORM,
    ...GRAPHS_THAT_HAVE_HISTNORM,
    ...GRAPHS_THAT_HAVE_HISTFUNC,
    ...GRAPHS_THAT_HAVE_POINTS,
    ...GRAPHS_THAT_HAVE_LINE_SHAPE
])];

/* 
    The graph setup tab where the user creates the structure of the graph by 
    selecting data
*/
function GraphSetupTab(
    props: {
        uiState: UIState;
        mitoAPI: MitoAPI;
        sheetDataArray: SheetData[];
        graphParams: GraphParamsFrontend
        columnDtypesMap: Record<string, string>;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        graphID: GraphID;
        setGraphParams: React.Dispatch<React.SetStateAction<GraphParamsFrontend>>;
        mitoContainerRef: React.RefObject<HTMLDivElement>;
    }): JSX.Element {

    const graphSheetIndex = props.graphParams.graphCreation.sheet_index;
    const graphPreprocessingParams = props.graphParams.graphPreprocessing;


    /* 
        Function responsible for updating the selected column headers for each axis. 
        Set the columnHeader at the index of the graphAxis selected columns array.
    
        To remove a column, leave the columnHeader empty.
    */
    const updateAxisData = (graphAxis: GraphAxisType, index: number, columnID?: ColumnID) => {
        // Get the current axis data
        let axisColumnIDs: ColumnID[] = []
        if (graphAxis === GraphAxisType.X_AXIS) {
            axisColumnIDs = props.graphParams.graphCreation.x_axis_column_ids
        } else {
            axisColumnIDs = props.graphParams.graphCreation.y_axis_column_ids
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
            props.setGraphParams(prevGraphParams => {
                const graphParamsCopy = window.structuredClone(prevGraphParams) 
                return {
                    ...graphParamsCopy,
                    graphCreation: {
                        ...graphParamsCopy.graphCreation, 
                        x_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        } else {
            props.setGraphParams(prevGraphParams => {
                const graphParamsCopy = window.structuredClone(prevGraphParams) 
                return {
                    ...graphParamsCopy,
                    graphCreation: {
                        ...graphParamsCopy.graphCreation, 
                        y_axis_column_ids: axisColumnIDsCopy
                    }
                }
            })
        }
    }

    const setGraphType = (graphType: GraphType) => {
        const xAxisColumnIDsCopy = [...props.graphParams.graphCreation.x_axis_column_ids]
        const yAxisColumnIDsCopy = [...props.graphParams.graphCreation.y_axis_column_ids]

        // Update the graph type and reset params that are only available for some graph types
        props.setGraphParams(prevGraphParams => {
            const graphParamsCopy: GraphParamsFrontend = window.structuredClone(prevGraphParams) 
            return {
                ...graphParamsCopy,
                graphCreation: {
                    ...graphParamsCopy.graphCreation,
                    graph_type: graphType,
                    x_axis_column_ids: xAxisColumnIDsCopy,
                    y_axis_column_ids: yAxisColumnIDsCopy,
                    color: GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(graphType) ? undefined : graphParamsCopy.graphCreation.color,
                    points: GRAPHS_THAT_HAVE_POINTS.includes(graphType) ? 'outliers' : undefined,
                    line_shape: GRAPHS_THAT_HAVE_LINE_SHAPE.includes(graphType) ? 'linear' : undefined,
                    nbins: undefined,
                    histnorm: undefined,
                    histfunc: GRAPHS_THAT_HAVE_HISTFUNC.includes(graphType) ? 'count' : undefined
                },
                graphStyling: {
                    ...graphParamsCopy.graphStyling,
                    barmode: GRAPHS_THAT_HAVE_BARMODE.includes(graphType) ? 'group' : undefined,
                    barnorm: undefined 
                }
            }
        })
    }

    const setColor = (newColorColumnID: ColumnID | undefined) => {
        props.setGraphParams(prevGraphParams => {
            const graphParamsCopy = window.structuredClone(prevGraphParams) 
            return {
                ...graphParamsCopy,
                graphCreation: {
                    ...graphParamsCopy.graphCreation, 
                    color: newColorColumnID
                }
            }
        })
    }

    function updateGraphParam(update: RecursivePartial<GraphParamsFrontend>): void {
        props.setGraphParams(prevGraphParams => {
            return updateObjectWithPartialObject(prevGraphParams, update);
        })
    }

    const colorByColumnTooltip = GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(props.graphParams.graphCreation.graph_type)
        ? `${props.graphParams.graphCreation.graph_type} does not support further breaking down data using color.`
        : 'Use an additional column to further breakdown the data by color.';

    const columnIDsMap = props.sheetDataArray[graphSheetIndex].columnIDsMap || {};

    return (  
        <Fragment>
            <div className='graph-sidebar-toolbar-content'>
                <DataframeSelect
                    title='Select the data sheet to graph.'
                    sheetDataArray={props.sheetDataArray}
                    sheetIndex={graphSheetIndex}
                    onChange={(newSheetIndex) => {
                        // Reset the graph params for the new sheet, but keep the graph type!
                        const newSheetGraphParams = getDefaultGraphParams(props.mitoContainerRef, props.sheetDataArray, newSheetIndex, props.graphID, props.graphParams.graphCreation.graph_type)

                        props.setGraphParams(newSheetGraphParams)
                    }}
                />
                <Row 
                    justify='space-between' 
                    align='center'
                    title='Select one of many Plotly graphs to create.'
                >
                    <Col>
                        <p className='text-header-3'>
                            Chart Type
                        </p>
                    </Col>
                    <Col>
                        <Select
                            value={props.graphParams.graphCreation.graph_type}
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
                                title={GraphType.LINE}
                            />
                            <DropdownItem
                                title={GraphType.SCATTER}
                            />
                            <DropdownItem
                                title={GraphType.HISTOGRAM}
                            />
                            <DropdownItem
                                title={GraphType.DENSITY_HEATMAP}
                            />
                            <DropdownItem
                                title={GraphType.DENSITY_CONTOUR}
                            />
                            <DropdownItem
                                title={GraphType.BOX}
                            />
                            <DropdownItem
                                title={GraphType.VIOLIN}
                            />
                            <DropdownItem
                                title={GraphType.STRIP}
                            />
                            <DropdownItem
                                title={GraphType.ECDF}
                            />
                        </Select>
                    </Col>
                </Row>

                <AxisSection
                    columnIDsMap={columnIDsMap}
                    graphType={props.graphParams.graphCreation.graph_type}
                    graphAxis={GraphAxisType.X_AXIS}
                    selectedColumnIDs={props.graphParams.graphCreation.x_axis_column_ids}
                    otherAxisSelectedColumnIDs={props.graphParams.graphCreation.y_axis_column_ids}
                    updateAxisData={updateAxisData}
                    mitoAPI={props.mitoAPI}
                />
                <AxisSection
                    columnIDsMap={columnIDsMap}
                    graphType={props.graphParams.graphCreation.graph_type}
                    graphAxis={GraphAxisType.Y_AXIS}
                    selectedColumnIDs={props.graphParams.graphCreation.y_axis_column_ids}
                    otherAxisSelectedColumnIDs={props.graphParams.graphCreation.x_axis_column_ids}
                    updateAxisData={updateAxisData}
                    mitoAPI={props.mitoAPI}
                />
                <div>
                    <Row 
                        justify='space-between' 
                        align='center' 
                        title={colorByColumnTooltip}
                        suppressTopBottomMargin
                    >
                        <Col>
                            <LabelAndTooltip tooltip={colorByColumnTooltip}>
                                Color By Column
                            </LabelAndTooltip>
                        </Col>
                        <Col>
                            <Select 
                                value={props.graphParams.graphCreation.color ? getDisplayColumnHeader(columnIDsMap[props.graphParams.graphCreation.color]) : 'None'}
                                disabled={GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(props.graphParams.graphCreation.graph_type)}
                                width='small'
                                searchable
                            >
                                {getColorDropdownItems(columnIDsMap, props.columnDtypesMap, setColor)}
                            </Select>
                        </Col>
                    </Row>
                </div>
                <Row 
                    justify='space-between' 
                    align='center'
                    title={getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                    <Col>
                        <LabelAndTooltip tooltip={getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex) ? SAFETY_FILTER_ENABLED_MESSAGE : SAFETY_FILTER_DISABLED_MESSAGE}>
                            {`Limit ${GRAPH_SAFETY_FILTER_CUTOFF} rows`}
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Toggle
                            value={props.graphParams.graphPreprocessing.safety_filter_turned_on_by_user}
                            onChange={() => {
                                updateGraphParam({graphPreprocessing: {safety_filter_turned_on_by_user: !graphPreprocessingParams.safety_filter_turned_on_by_user}})
                            }}
                            disabled={!getDefaultSafetyFilter(props.sheetDataArray, graphSheetIndex)}
                        />
                    </Col>
                </Row>
                {GRAPHS_WITH_UNIQUE_CONFIG_OPTIONS.includes(props.graphParams.graphCreation.graph_type) && 
                    <CollapsibleSection 
                        title={getGraphTypeFullName(props.graphParams.graphCreation.graph_type) + ' configuration'}
                    >
                        {GRAPHS_THAT_HAVE_NBINS.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title='Number of bins in histogram'>
                                <Col>
                                    <p>
                                        Number of bins (int)
                                    </p>
                                </Col>
                                <Input
                                    value={props.graphParams.graphCreation.nbins?.toString() || ''}
                                    type='number'
                                    placeholder='5'
                                    onChange={(e) => {
                                        const newNumberBins = e.target.value === '' ? undefined : e.target.value
                                        updateGraphParam({graphCreation: {nbins: newNumberBins}})
                                    }}
                                    width='small'
                                />
                            </Row>
                        }
                        {GRAPHS_THAT_HAVE_BARMODE.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title='How bars are grouped together when there are multiple'>
                                <Col>
                                    <LabelAndTooltip tooltip='How bars are grouped together when there are multiple' textBody>
                                        Bar mode
                                    </LabelAndTooltip>
                                </Col>
                                <Select
                                    value={props.graphParams.graphStyling.barmode || 'group'}
                                    onChange={(newBarMode: string) => {
                                        updateGraphParam({graphStyling: {barmode: newBarMode}})

                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={'stack'}
                                    />
                                    <DropdownItem
                                        title={'group'}
                                    />
                                    <DropdownItem
                                        title={'overlay'}
                                    />
                                    <DropdownItem
                                        title={'relative'}
                                    />
                                </Select>
                            </Row>
                        }
                        {GRAPHS_THAT_HAVE_BARNORM.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title="Normalize strategy used for each group of bars at a specific location on the graph's domain">
                                <Col>
                                    <LabelAndTooltip tooltip="Normalize strategy used for each group of bars at a specific location on the graph's domain" textBody>
                                        Bar normalization
                                    </LabelAndTooltip>
                                </Col>
                                <Select
                                    value={props.graphParams.graphStyling.barnorm || 'none'}
                                    onChange={(newBarNorm: string) => {
                                        if (newBarNorm === 'none') {
                                            updateGraphParam({graphStyling: {barnorm: undefined}});
                                            return;
                                        }
                                        updateGraphParam({graphStyling: {barnorm: newBarNorm}})
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={'none'}
                                    />
                                    <DropdownItem
                                        title={'fraction'}
                                        subtext='value of each bar divided by the sum of all values at that location'
                                    />
                                    <DropdownItem
                                        title={'percent'}
                                        subtext='fraction multiplied by 100'
                                    />
                                </Select>
                            </Row>
                        }
                        {GRAPHS_THAT_HAVE_HISTNORM.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title='Normalization strategy used for each graphed series in the histogram'>
                                <Col>
                                    <LabelAndTooltip tooltip='Normalization strategy used for each graphed series in the histogram' textBody>
                                        Hist normalization
                                    </LabelAndTooltip>
                                </Col>
                                <Select
                                    value={props.graphParams.graphCreation.histnorm || 'none'}
                                    onChange={(newHistnorm: string) => {
                                        if (newHistnorm === 'none') {
                                            updateGraphParam({graphCreation: {histnorm: undefined}});
                                            return;
                                        }
                                        updateGraphParam({graphCreation: {histnorm: newHistnorm}})
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={'none'}
                                    />
                                    <DropdownItem
                                        title={'probability'}
                                        subtext='occurrences in bin divided by total number of sample points'
                                    />
                                    <DropdownItem
                                        title={'percent'}
                                        subtext='probabilty multiplied by 100'
                                    />
                                    <DropdownItem
                                        title={'density'}
                                        subtext='occurences in bin divided by bin interval'
                                    />
                                    <DropdownItem
                                        title={'probability density'}
                                        subtext='probability that a point falls into bin'
                                    />
                                </Select>
                            </Row>
                        }
                        {GRAPHS_THAT_HAVE_HISTFUNC.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title='The metric displayed for each bin of data'>
                                <Col>
                                    <LabelAndTooltip tooltip='The metric displayed for each bin of data' textBody>
                                        Hist Function
                                    </LabelAndTooltip>
                                </Col>
                                <Select
                                    value={props.graphParams.graphCreation.histfunc || 'count'}
                                    onChange={(newHistfunc: string) => {
                                        updateGraphParam({graphCreation: {histfunc: newHistfunc}})
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={'count'}
                                        subtext='number of values in each bin'
                                    />
                                    <DropdownItem
                                        title={'sum'}
                                        subtext='sum of values in each bin'
                                    />
                                    <DropdownItem
                                        title={'avg'}
                                        subtext='average value in each bin'
                                    />
                                    <DropdownItem
                                        title={'min'}
                                        subtext='min value in each bin'
                                    />
                                    <DropdownItem
                                        title={'max'}
                                        subtext='max value in each bin'
                                    />
                                </Select>
                            </Row>
                        }
                        {GRAPHS_THAT_HAVE_POINTS.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title='Display outlier points'>
                                <Col>
                                    <p>
                                        Points
                                    </p>
                                </Col>
                                <Select
                                    value={props.graphParams.graphCreation.points === false ? 'none' : props.graphParams.graphCreation.points !== undefined ? props.graphParams.graphCreation.points : ''}
                                    onChange={(newPointsString) => {
                                        const newPointsParams = newPointsString === 'false' ? false : newPointsString
                                        updateGraphParam({graphCreation: {points: newPointsParams}})

                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem
                                        title={'outliers'}
                                        subtext='only display sample points outside the whiskers'
                                    />
                                    <DropdownItem
                                        title={'supsected outliers'}
                                        id={'suspectedoutliers'}
                                        subtext='display outlier and suspected outlier points'
                                    />
                                    <DropdownItem
                                        title={'all'}
                                        subtext='display all sample points'
                                    />
                                    <DropdownItem
                                        title={'none'}
                                        id='false'
                                        subtext='display no individual sample points'
                                    />
                                </Select>
                            </Row>
                        }
                        {GRAPHS_THAT_HAVE_LINE_SHAPE.includes(props.graphParams.graphCreation.graph_type) && 
                            <Row justify='space-between' align='center' title='The shape of the line'>
                                <Col>
                                    <p>
                                        Line shape
                                    </p>
                                </Col>
                                <Select
                                    value={props.graphParams.graphCreation.line_shape || 'linear'}
                                    onChange={(newLineShape) => {
                                        updateGraphParam({graphCreation: {line_shape: newLineShape}})
                                    }}
                                    width='small'
                                    dropdownWidth='medium'
                                >
                                    <DropdownItem 
                                        title={'linear'} 
                                        subtext='straight line between points'
                                    />
                                    <DropdownItem 
                                        title={'spline'} 
                                        subtext='spline interpolation between points'
                                    />
                                    <DropdownItem 
                                        title={'hv'} 
                                        subtext='horizontal vertical' 
                                    />
                                    <DropdownItem 
                                        title={'vh'} 
                                        subtext='veritical horizontal'
                                    />
                                    <DropdownItem
                                        title={'hvh'}
                                        subtext='horizontal vertical horizontal'
                                    />
                                    <DropdownItem 
                                        title={'vhv'} 
                                        subtext='vertical horizontal vertical'
                                    />
                                </Select>
                            </Row>
                        }
                    </CollapsibleSection>
                }
                <CollapsibleSection title="Facet plots">
                    <div>
                        <Row 
                            justify='space-between' 
                            align='center' 
                            title={"Create subplots based on this attribute"}
                        >
                            <Col>
                                <LabelAndTooltip tooltip="Create subplots based on this attribute" textBody>
                                    Facet Column
                                </LabelAndTooltip>
                            </Col>
                            <Col>
                                <Select 
                                    value={props.graphParams.graphCreation.facet_col_column_id ? getDisplayColumnHeader(columnIDsMap[props.graphParams.graphCreation.facet_col_column_id]) : 'None'}
                                    width='small'
                                    searchable
                                >
                                    {[<DropdownItem
                                        key='None'
                                        title='None'
                                        onClick={() => {
                                            updateGraphParam({graphCreation: {facet_col_column_id: undefined}})
                                        }}
                                    />].concat(
                                        (Object.keys(columnIDsMap) || []).map(columnID => {
                                            const columnHeader = columnIDsMap[columnID];
                                            return (
                                                <DropdownItem
                                                    key={columnID}
                                                    title={getDisplayColumnHeader(columnHeader)}
                                                    onClick={() => {
                                                        updateGraphParam({graphCreation: {facet_col_column_id: columnID}})
                                                    }}
                                                />
                                            )
                                        })
                                    )}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                    <div>
                        <Row 
                            justify='space-between' 
                            align='center' 
                            title={"Create subplots based on this attribute"}
                        >
                            <Col>
                                <LabelAndTooltip tooltip="Create subplots based on this attribute" textBody>
                                    Facet row
                                </LabelAndTooltip>
                            </Col>
                            <Col>
                                <Select 
                                    value={props.graphParams.graphCreation.facet_row_column_id ? getDisplayColumnHeader(columnIDsMap[props.graphParams.graphCreation.facet_row_column_id]) : 'None'}
                                    width='small'
                                    searchable
                                >
                                    {[<DropdownItem
                                        key='None'
                                        title='None'
                                        onClick={() => {
                                            updateGraphParam({graphCreation: {facet_row_column_id: undefined}})
                                        }}
                                    />].concat(
                                        (Object.keys(columnIDsMap) || []).map(columnID => {
                                            const columnHeader = columnIDsMap[columnID];
                                            return (
                                                <DropdownItem
                                                    key={columnID}
                                                    title={getDisplayColumnHeader(columnHeader)}
                                                    onClick={() => {
                                                        updateGraphParam({graphCreation: {facet_row_column_id: columnID}})
                                                    }}
                                                />
                                            )
                                        })
                                    )}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                </CollapsibleSection>
            </div>
        </Fragment>
    )
} 

export default GraphSetupTab;
