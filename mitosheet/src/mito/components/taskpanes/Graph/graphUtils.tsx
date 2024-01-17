// Helper function for creating default graph params. Defaults to a Bar chart, 
import React from "react"
import { MitoAPI, getRandomId } from "../../../api/api"
import { ColumnID, ColumnIDsMap, EditorState, GraphID, GraphParamsBackend, GraphParamsFrontend, GraphRenderingParams, GraphSidebarTab, SheetData, UIState } from "../../../types"
import { intersection } from "../../../utils/arrays"
import { getDisplayColumnHeader } from "../../../utils/columnHeaders"
import { isDatetimeDtype, isNumberDtype } from "../../../utils/dtypes"
import { convertStringToFloatOrUndefined } from "../../../utils/numbers"
import { convertToStringOrUndefined } from "../../../utils/strings"
import DropdownItem from "../../elements/DropdownItem"
import { ModalEnum } from "../../modals/modals"
import { TaskpaneType } from "../taskpanes"
import { GRAPHS_THAT_HAVE_BARMODE, GRAPHS_THAT_HAVE_HISTFUNC, GRAPHS_THAT_HAVE_LINE_SHAPE, GRAPHS_THAT_HAVE_POINTS, GRAPH_SAFETY_FILTER_CUTOFF, GraphType } from "./GraphSetupTab"

// Note: these should match the constants in Python as well
const DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT = '#FFFFFF'
const DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT = '#E6EBF5'
const DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT = '#2F3E5D'

/**
 * Returns the default axis column ids for a given graph type and selected column ids.
 * Used to set the default axis column ids based on the current selection when creating a new graph.
 */
const getAxisColumnIDs = (sheetData: SheetData, graphType?: GraphType, selectedColumnIds?: ColumnID[]): {
    x_axis_column_ids: ColumnID[],
    y_axis_column_ids: ColumnID[]
} => {
    if (selectedColumnIds === undefined || selectedColumnIds.length === 0) {
        return {
            x_axis_column_ids: [],
            y_axis_column_ids: []
        }
    }
    if (selectedColumnIds.length === 1) {
        return {
            x_axis_column_ids: [],
            y_axis_column_ids: selectedColumnIds
        }
    }
    if (graphType === GraphType.SCATTER) {
        return {
            x_axis_column_ids: [selectedColumnIds[0]],
            y_axis_column_ids: selectedColumnIds.slice(1)
        }
    } else {
        if (!isNumberDtype(sheetData.columnDtypeMap[selectedColumnIds[0]])) {
            return {
                x_axis_column_ids: [selectedColumnIds[0]],
                y_axis_column_ids: selectedColumnIds.slice(1)
            }
        } else {
            return {
                x_axis_column_ids: [],
                y_axis_column_ids: selectedColumnIds
            }
        }
    }
}

export const getValidParamsFromExistingParams = (existingParams: GraphParamsFrontend, sheetDataArray: SheetData[]): GraphParamsFrontend => {
    const graphDataSourceSheetIndex = existingParams.graphCreation.sheet_index;
    const validColumnIDs = sheetDataArray[graphDataSourceSheetIndex] !== undefined ? sheetDataArray[graphDataSourceSheetIndex].data.map(c => c.columnID) : [];

    const xAxisColumnIDs = intersection(
        validColumnIDs,
        existingParams.graphCreation.x_axis_column_ids
    )
    const yAxisColumnIDs = intersection(
        validColumnIDs,
        existingParams.graphCreation.y_axis_column_ids
    )

    const color = existingParams.graphCreation.color !== undefined && validColumnIDs.includes(existingParams.graphCreation.color) ? existingParams.graphCreation.color : undefined

    return {
        ...existingParams,
        graphCreation: {
            ...existingParams.graphCreation,
            x_axis_column_ids: xAxisColumnIDs,
            y_axis_column_ids: yAxisColumnIDs,
            color: color
        }
    }
}


export const getDefaultGraphParams = (
        mitoContainerRef: React.RefObject<HTMLDivElement>,
        sheetDataArray: SheetData[], 
        sheetIndex: number, 
        graphID: GraphID, 
        graphType?: GraphType, 
        selectedColumnIds?: ColumnID[], 
        existingParams?: GraphParamsFrontend
    ): GraphParamsFrontend => {
    
    if (existingParams !== undefined) {
        return getValidParamsFromExistingParams(existingParams, sheetDataArray)
    }
    
    graphType = graphType || GraphType.BAR
    const axis_column_ids = getAxisColumnIDs(sheetDataArray[sheetIndex], graphType, selectedColumnIds);
    
    return {
        graphID: graphID ?? getRandomId(),
        graphPreprocessing: {
            safety_filter_turned_on_by_user: true
        },
        graphCreation: {
            graph_type: graphType,
            sheet_index: sheetIndex,
            color: undefined,
            facet_col_column_id: undefined,
            facet_row_column_id: undefined,
            facet_col_wrap: undefined,
            facet_col_spacing: undefined,
            facet_row_spacing: undefined,
            ...axis_column_ids,
            // Params that are only available to some graph types
            points: GRAPHS_THAT_HAVE_POINTS.includes(graphType) ? 'outliers' : undefined,
            line_shape: GRAPHS_THAT_HAVE_LINE_SHAPE.includes(graphType) ? 'linear' : undefined,
            nbins: undefined,
            histnorm: undefined,
            histfunc: GRAPHS_THAT_HAVE_HISTFUNC.includes(graphType) ? 'count' : undefined
        },
        graphStyling: {
            title: {
                title: undefined,
                visible: true,
                title_font_color: DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT
            },
            xaxis: {
                title: undefined,
                visible: true,
                title_font_color: DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT,
                type: undefined,
                showgrid: true,
                gridwidth: undefined,
                rangeslider: {
                    visible: true,
                },
            },
            yaxis: {
                title: undefined,
                visible: true,
                title_font_color: DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT,
                type: undefined,
                showgrid: true,
                gridwidth: undefined,
            },
            showlegend: true,
            legend: {
                title: {
                    text: undefined
                },
                orientation: 'v',
                x: undefined, 
                y: undefined,
            },
            paper_bgcolor: DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT,
            plot_bgcolor: DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT,

            // Params that are only available to some graph types
            barmode: GRAPHS_THAT_HAVE_BARMODE.includes(graphType) ? 'group' : undefined,
            barnorm: undefined,
        },
        graphRendering: getGraphRenderingParams(mitoContainerRef)
    }
}



// Helper function for getting the default safety filter status
export const getDefaultSafetyFilter = (sheetDataArray: SheetData[], sheetIndex: number): boolean => {
    return sheetDataArray[sheetIndex] === undefined || sheetDataArray[sheetIndex].numRows > GRAPH_SAFETY_FILTER_CUTOFF
}

// Returns a list of dropdown items. Selecting them sets the color attribute of the graph.
// Option 'None' always comes first.
export const getColorDropdownItems = (
    graphSheetIndex: number,
    columnIDsMapArray: ColumnIDsMap[],
    columnDtypesMap: Record<string, string>,
    setColor: (columnID: ColumnID | undefined) => void,
): JSX.Element[] => {
    const NoneOption = [(
        <DropdownItem
            key='None'
            title='None'
            onClick={() => setColor(undefined)}
        />
    )]
    
    const columnDropdownItems = Object.keys(columnIDsMapArray[graphSheetIndex] || {}).map(columnID => {
        const columnHeader = columnIDsMapArray[graphSheetIndex][columnID];

        // Plotly doesn't support setting the color as a date series, so we disable date series dropdown items
        const disabled = isDatetimeDtype(columnDtypesMap[columnID])
        return (
            <DropdownItem
                key={columnID}
                title={getDisplayColumnHeader(columnHeader)}
                onClick={() => setColor(columnID)}
                disabled={disabled}
                subtext={disabled ? 'Dates cannot be used as the color breakdown property' : ''}
                hideSubtext
                displaySubtextOnHover
            />
        )
    })

    return NoneOption.concat(columnDropdownItems)
}

export const getGraphTypeFullName = (graphType: GraphType): string => {
    switch(graphType) {
        case GraphType.BAR: return 'Bar chart'
        case GraphType.BOX: return 'Box plot'
        case GraphType.DENSITY_CONTOUR: return 'Density contour'
        case GraphType.DENSITY_HEATMAP: return 'Density heatmap'
        case GraphType.ECDF: return 'ECDF'
        case GraphType.HISTOGRAM: return 'Histogram'
        case GraphType.LINE: return 'Line chart'
        case GraphType.SCATTER: return 'Scatter plot'
        case GraphType.STRIP: return 'Strip plot'
        case GraphType.VIOLIN: return 'Violin plot'
    }
}

export const getGraphRenderingParams = (mitoContainerRef: React.RefObject<HTMLDivElement>): GraphRenderingParams => {
    const centerContentContainerBoundingRect: DOMRect | undefined = mitoContainerRef.current
             ?.querySelector('#mito-center-content-container')
             ?.getBoundingClientRect();

        const graphSidebarToolbarContainerBoundingRect: DOMRect | undefined = mitoContainerRef.current
            ?.querySelector('.graph-sidebar-toolbar-container')
            ?.getBoundingClientRect();

        if (centerContentContainerBoundingRect === undefined || graphSidebarToolbarContainerBoundingRect === undefined) {
            return {
                height: undefined,
                width: undefined
            };
        }

        const newHeight = `${centerContentContainerBoundingRect?.height - 10}px`; // Subtract pixels from the height & width to account for padding
        const newWidth = `${centerContentContainerBoundingRect?.width - 20 - graphSidebarToolbarContainerBoundingRect.width}px`;

        return {
            height: newHeight,
            width: newWidth,
        }
}

export const convertFrontendtoBackendGraphParams = (graphParamsFrontend: GraphParamsFrontend): GraphParamsBackend => {
    const graphCreationParams = graphParamsFrontend.graphCreation
    const graphStylingParams = graphParamsFrontend.graphStyling

    return {
        graph_id: graphParamsFrontend.graphID,
        graph_creation: {
            ...graphParamsFrontend.graphCreation,
            facet_col_wrap: convertStringToFloatOrUndefined(graphCreationParams.facet_col_wrap),
            facet_col_spacing: convertStringToFloatOrUndefined(graphCreationParams.facet_col_spacing),
            facet_row_spacing: convertStringToFloatOrUndefined(graphCreationParams.facet_row_spacing),
            nbins: convertStringToFloatOrUndefined(graphCreationParams.nbins),
        },
        graph_styling: {
            ...graphParamsFrontend.graphStyling,
            xaxis: {
                ...graphParamsFrontend.graphStyling.xaxis,
                gridwidth: convertStringToFloatOrUndefined(graphStylingParams.xaxis.gridwidth)
            },
            yaxis: {
                ...graphParamsFrontend.graphStyling.yaxis,
                gridwidth: convertStringToFloatOrUndefined(graphStylingParams.yaxis.gridwidth)
            },
            legend: {
                ...graphParamsFrontend.graphStyling.legend,
                x: convertStringToFloatOrUndefined(graphStylingParams.legend.x),
                y: convertStringToFloatOrUndefined(graphStylingParams.legend.y)
            }
        },
        graph_preprocessing: graphParamsFrontend.graphPreprocessing,
        graph_rendering: graphParamsFrontend.graphRendering
    }
}

export const convertBackendtoFrontendGraphParams = (graphParamsBackend: GraphParamsBackend): GraphParamsFrontend => {
    const graphCreationParams = graphParamsBackend.graph_creation
    const graphStylingParams = graphParamsBackend.graph_styling

    return {
        graphID: graphParamsBackend.graph_id,
        graphCreation: {
            ...graphCreationParams,
            facet_col_wrap: convertToStringOrUndefined(graphCreationParams.facet_col_wrap),
            facet_col_spacing: convertToStringOrUndefined(graphCreationParams.facet_col_spacing),
            facet_row_spacing: convertToStringOrUndefined(graphCreationParams.facet_row_spacing),
            nbins: convertToStringOrUndefined(graphCreationParams.nbins)
        },
        graphStyling: {
            ...graphStylingParams,
            xaxis: {
                ...graphStylingParams.xaxis,
                gridwidth: convertToStringOrUndefined(graphStylingParams.xaxis.gridwidth)
            },
            yaxis: {
                ...graphStylingParams.yaxis,
                gridwidth: convertToStringOrUndefined(graphStylingParams.yaxis.gridwidth)
            },
            legend: {
                ...graphStylingParams.legend,
                x: convertToStringOrUndefined(graphStylingParams.legend.x),
                y: convertToStringOrUndefined(graphStylingParams.legend.y)
            }
        },
        graphPreprocessing: graphParamsBackend.graph_preprocessing,
        graphRendering: graphParamsBackend.graph_rendering
    }
}

export const getParamsForExistingGraph = async (
    mitoAPI: MitoAPI,
    graphID: GraphID,
): Promise<GraphParamsFrontend | undefined> => {
    const response = await mitoAPI.getGraphParams(graphID);
    const existingParamsBackend = 'error' in response ? undefined : response.result;
    if (existingParamsBackend !== undefined) {
        return convertBackendtoFrontendGraphParams(existingParamsBackend);
    }
}

/**
 * A utility for opening the graph sidebar. 
 * 
 * 
 */
export const openGraphSidebar = async (
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    uiState: UIState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    sheetDataArray: SheetData[],
    mitoAPI: MitoAPI,
    graphToOpen: {
        type: 'open_existing_graph'
        graphID: GraphID
    } | {
        type: 'open_new_graph'
        graphType: GraphType
        selectedColumnIds?: ColumnID[]
    } | {
        type: 'duplicate_graph_from_existing',
        graphIDToDuplicate: GraphID
    }
) => {



    // We turn off editing mode, if it is on
    setEditorState(undefined);

    // If there is no data, prompt the user to import and nothing else
    if (sheetDataArray.length === 0) {
        setUIState((prevUIState) => {
            return {
                ...prevUIState,
                currOpenTaskpane: {
                    type: TaskpaneType.IMPORT_FIRST,
                    message: 'Before graphing data, you need to import some!'
                }
            }
        })
        return;
    }

    if (graphToOpen.type === 'open_existing_graph') {
        const existingParams = await getParamsForExistingGraph(mitoAPI, graphToOpen.graphID);
        setUIState({
            ...uiState,
            selectedTabType: 'graph',
            currOpenModal: {type: ModalEnum.None},
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                existingParams: existingParams,
                graphID: graphToOpen.graphID,
                graphSidebarTab: GraphSidebarTab.Setup
            }
        })
    } else if (graphToOpen.type === 'open_new_graph') {
        const newGraphID = getRandomId();
        setUIState({
            ...uiState,
            selectedTabType: 'graph',
            currOpenModal: {type: ModalEnum.None},
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                graphID: newGraphID,
                graphSidebarTab: GraphSidebarTab.Setup
            }
        })
    } else {
        // If we're duplicating a graph, we get its params, but also get a new graph ID
        // with these params
        const existingParams = await getParamsForExistingGraph(mitoAPI, graphToOpen.graphIDToDuplicate);
        const newGraphID = getRandomId();
        setUIState({
            ...uiState,
            selectedTabType: 'graph',
            currOpenModal: {type: ModalEnum.None},
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                graphID: newGraphID,
                existingParams: existingParams,
                graphSidebarTab: GraphSidebarTab.Setup
            }
        })
    }
}