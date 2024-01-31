// Helper function for creating default graph params. Defaults to a Bar chart, 
import React from "react"
import { MitoAPI, getRandomId } from "../../../api/api"
import { ColumnID, ColumnIDsMap, EditorState, GraphData, GraphID, GraphOutput, GraphParamsBackend, GraphParamsFrontend, GraphRenderingParams, GraphSidebarTab, SheetData, UIState } from "../../../types"
import { intersection } from "../../../utils/arrays"
import { getDisplayColumnHeader } from "../../../utils/columnHeaders"
import { isDatetimeDtype, isNumberDtype } from "../../../utils/dtypes"
import { convertStringToFloatOrUndefined } from "../../../utils/numbers"
import { convertToStringOrUndefined } from "../../../utils/strings"
import DropdownItem from "../../elements/DropdownItem"
import { ModalEnum } from "../../modals/modals"
import { TaskpaneType } from "../taskpanes"
import { GRAPHS_THAT_HAVE_BARMODE, GRAPHS_THAT_HAVE_HISTFUNC, GRAPHS_THAT_HAVE_LINE_SHAPE, GRAPHS_THAT_HAVE_POINTS } from "../../toolbar/GraphTabs/ChangeChartTypeButton"
import { GRAPH_SAFETY_FILTER_CUTOFF, GraphType } from "./GraphSetupTab"
import { OpenGraphType } from "../../../types"

// Note: these should match the constants in Python as well
const DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT = '#FFFFFF'
const DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT = '#E6EBF5'
const DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT = '#2F3E5D'

export interface GraphElementType {
    element: 'gtitle' | 'xtitle' | 'ytitle',

    /** This is the value to default to if there is no value defined in the graph params */
    defaultValue?: string,
    
    popupPosition?: {
        left?: number,
        right?: number,
        top?: number,
        bottom?: number,
    }
}

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

export const deleteGraphs = async (graphIDs: GraphID[], mitoAPI: MitoAPI, setUIState: React.Dispatch<React.SetStateAction<UIState>>, graphDataArray: GraphData[]) => {
    const remainingGraphIDs = graphDataArray.filter(graphData => !graphIDs.includes(graphData.graph_id)).map(graphData => graphData.graph_id);
    for (const graphID of graphIDs) {
        await mitoAPI.editGraphDelete(graphID)
    }
    if (remainingGraphIDs.length === 0) {
        return setUIState(prevUIState => {
            return {
                ...prevUIState,
                selectedTabType: 'data',
                selectedSheetIndex: 0,
                currOpenTaskpane: { type: TaskpaneType.NONE }
            }
        })
    }

    const existingParams = await getParamsForExistingGraph(mitoAPI, remainingGraphIDs[0]);
    if (existingParams === undefined) {
        return;
    }
    return setUIState(prevUIState => {
        return {
            ...prevUIState,
            selectedTabType: 'graph',
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                graphSidebarTab: GraphSidebarTab.Setup,
                openGraph: {
                    type: 'existing_graph',
                    graphID: remainingGraphIDs[0],
                    existingParams: existingParams
                }
            }
        }
    })
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
    selectedSheetIndex: number,
    openGraph: OpenGraphType
): GraphParamsFrontend => {

    const graphRenderingParams = getGraphRenderingParams(mitoContainerRef)

    if (openGraph.type === 'existing_graph') {
        const newValidParams = getValidParamsFromExistingParams(openGraph.existingParams, sheetDataArray);
        return {
            ...newValidParams,
            graphRendering: graphRenderingParams
        }
    }


    if (openGraph.type === 'new_duplicate_graph') {
        const newValidParams = getValidParamsFromExistingParams(openGraph.existingParamsOfDuplicated, sheetDataArray);
        return {
            ...newValidParams,
            graphID: openGraph.graphID,
            graphRendering: graphRenderingParams
        }
    }

    // This is the case where we are creating a new graph
    const newGraphType = openGraph.graphType;
    const selectedColumnIDs = openGraph.selectedColumnIds;
    
    const axis_column_ids = getAxisColumnIDs(sheetDataArray[selectedSheetIndex], newGraphType, selectedColumnIDs);
    
    return {
        graphID: openGraph.graphID,
        graphPreprocessing: {
            safety_filter_turned_on_by_user: true
        },
        graphCreation: {
            graph_type: newGraphType,
            sheet_index: selectedSheetIndex,
            color: undefined,
            facet_col_column_id: undefined,
            facet_row_column_id: undefined,
            facet_col_wrap: undefined,
            facet_col_spacing: undefined,
            facet_row_spacing: undefined,
            ...axis_column_ids,
            // Params that are only available to some graph types
            points: GRAPHS_THAT_HAVE_POINTS.includes(newGraphType) ? 'outliers' : undefined,
            line_shape: GRAPHS_THAT_HAVE_LINE_SHAPE.includes(newGraphType) ? 'linear' : undefined,
            nbins: undefined,
            histnorm: undefined,
            histfunc: GRAPHS_THAT_HAVE_HISTFUNC.includes(newGraphType) ? 'count' : undefined
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
            barmode: GRAPHS_THAT_HAVE_BARMODE.includes(newGraphType) ? 'group' : undefined,
            barnorm: undefined,
        },
        graphRendering: graphRenderingParams
    }
}



// Helper function for getting the default safety filter status
export const getDefaultSafetyFilter = (sheetDataArray: SheetData[], sheetIndex: number): boolean => {
    return sheetDataArray[sheetIndex] === undefined || sheetDataArray[sheetIndex].numRows > GRAPH_SAFETY_FILTER_CUTOFF
}

// Returns a list of dropdown items. Selecting them sets the color attribute of the graph.
// Option 'None' always comes first.
export const getColorDropdownItems = (
    columnIDsMap: ColumnIDsMap,
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
    
    const columnDropdownItems = Object.keys(columnIDsMap || {}).map(columnID => {
        const columnHeader = columnIDsMap[columnID];

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


export const openGraphSidebar = async (
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    uiState: UIState,
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
    sheetDataArray: SheetData[],
    mitoAPI: MitoAPI,
    newOpenGraph: {
        type: 'existing_graph'
        graphID: GraphID
    } | {
        type: 'new_graph'
        graphType: GraphType
        selectedColumnIds?: ColumnID[]
    } | {
        type: 'new_duplicate_graph',
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

    if (newOpenGraph.type === 'existing_graph') {
        const existingParams = await getParamsForExistingGraph(mitoAPI, newOpenGraph.graphID);
        if (existingParams === undefined) {
            return;
        }
        setUIState({
            ...uiState,
            selectedTabType: 'graph',
            currOpenModal: {type: ModalEnum.None},
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                graphSidebarTab: GraphSidebarTab.Setup,
                openGraph: {
                    type: 'existing_graph',
                    graphID: newOpenGraph.graphID,
                    existingParams: existingParams
                }
            },
            currentToolbarTab: 'Chart Design'
        })
    } else if (newOpenGraph.type === 'new_graph') {
        const newGraphID = getRandomId();
        setUIState({
            ...uiState,
            selectedTabType: 'graph',
            currOpenModal: {type: ModalEnum.None},
            currentToolbarTab: 'Chart Design',
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                graphSidebarTab: GraphSidebarTab.Setup,
                openGraph: {
                    type: 'new_graph',
                    graphID: newGraphID,
                    graphType: newOpenGraph.graphType,
                    selectedColumnIds: newOpenGraph.selectedColumnIds
                }
            }
        })
    } else {
        // If we're duplicating a graph, we get its params, but also get a new graph ID
        // with these params
        const existingParams = await getParamsForExistingGraph(mitoAPI, newOpenGraph.graphIDToDuplicate);
        if (existingParams === undefined) {
            return;
        }
        
        const newGraphID = getRandomId();
        setUIState({
            ...uiState,
            selectedTabType: 'graph',
            currOpenModal: {type: ModalEnum.None},
            currOpenTaskpane: {
                type: TaskpaneType.GRAPH,
                graphSidebarTab: GraphSidebarTab.Setup,
                openGraph: {
                    type: 'new_duplicate_graph',
                    graphID: newGraphID,
                    graphIDOfDuplicated: newOpenGraph.graphIDToDuplicate,
                    existingParamsOfDuplicated: existingParams
                }
            }
        })
    }
}

export const getGraphElementObjects = (graphOutput: GraphOutput) => {
    if (graphOutput === undefined) {
        return;
    }
    const div: any = document.getElementById(graphOutput.graphHTML.split('id="')[1].split('"')[0])
    if (div === null) {
        return;
    }
    
    // Main Title
    return { 
        gtitle: div.getElementsByClassName('g-gtitle')[0],
        xtitle: div.getElementsByClassName('g-xtitle')[0],
        ytitle: div.getElementsByClassName('g-ytitle')[0]
    }
}

export const getGraphElementInfoFromHTMLElement = (graphElement: Element, elementType: 'gtitle' | 'xtitle' | 'ytitle', graphOutput: GraphOutput): GraphElementType => {
    const clientRect = graphElement.getBoundingClientRect()

    if (graphOutput === undefined) {
        return {
            element: elementType,
            popupPosition: {
                left: 0,
                top: 0
            },
            defaultValue: ''
        }
    }
    const parentDiv = document.getElementById(graphOutput.graphHTML.split('id="')[1].split('"')[0]);
    const parentDivClientRect = parentDiv?.getBoundingClientRect();
    const parentDivLeft = parentDivClientRect?.left ?? 0;
    const parentDivTop = parentDivClientRect?.top ?? 0;
    const parentDivBottom = parentDivClientRect?.bottom ?? 0;
    if (elementType === 'gtitle') {
        return {
            element: 'gtitle',
            popupPosition: {
                left: clientRect.left - parentDivLeft,
                top: clientRect.bottom - parentDivTop + 10
            },
            defaultValue: graphElement.children?.[0]?.innerHTML
        }
    } else if (elementType === 'xtitle') {
        return {
            element: 'xtitle',
            popupPosition: {
                left: (clientRect.left + clientRect.right) / 2 - parentDivLeft - 70,
                bottom: (parentDivBottom - clientRect.top) + 10
            },
            defaultValue: graphElement.children?.[0]?.innerHTML
        }
    } else {
        return {
            element: 'ytitle',
            popupPosition: {
                left: clientRect.left - parentDivLeft,
                bottom: parentDivBottom - clientRect.top + 10
            },
            defaultValue: graphElement.children?.[0]?.innerHTML
        }
    }
}

export const registerClickEventsForGraphElements = (graphOutput: GraphOutput, setSelectedGraphElement: ((element: GraphElementType | null) => void), mitoContainerRef: React.RefObject<HTMLDivElement>) => {
    const graphElementObjects = getGraphElementObjects(graphOutput);
    if (graphElementObjects === undefined) {
        return;
    }
    
    const { gtitle, ytitle, xtitle } = graphElementObjects;

    // First, add the style to make it clickable with pointer-events: all
    gtitle.style.pointerEvents = 'all'
    xtitle.style.pointerEvents = 'all'
    ytitle.style.pointerEvents = 'all'

    /**
     * Set selected graph element when clicked
     */
    gtitle.addEventListener('click', () => {
        setSelectedGraphElement({
            element: 'gtitle',
        })
    })
    xtitle.addEventListener('click', () => {
        setSelectedGraphElement({
            element: 'xtitle',
        });
    })
    ytitle.addEventListener('click', () => {
        setSelectedGraphElement({
            element: 'ytitle',
        })
    })

    /**
     * Open popup when double clicked
     */
    gtitle.addEventListener('dblclick', () => {
        setSelectedGraphElement(getGraphElementInfoFromHTMLElement(gtitle, 'gtitle', graphOutput))
    });

    xtitle.addEventListener('dblclick', () => {
        setSelectedGraphElement(getGraphElementInfoFromHTMLElement(xtitle, 'xtitle', graphOutput))
    });

    ytitle.addEventListener('dblclick', () => {
        setSelectedGraphElement(getGraphElementInfoFromHTMLElement(ytitle, 'ytitle', graphOutput))
    });
}