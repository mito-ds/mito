// Helper function for creating default graph params. Defaults to a Bar chart, 
import React from "react"
import { ColumnID, ColumnIDsMap, EditorState, GraphDataDict, GraphID, GraphParamsBackend, GraphParamsFrontend, SheetData, UIState } from "../../../types"
import { intersection } from "../../../utils/arrays"
import { getDisplayColumnHeader } from "../../../utils/columnHeaders"
import { isDatetimeDtype } from "../../../utils/dtypes"
import { convertStringToFloatOrUndefined } from "../../../utils/numbers"
import { convertToStringOrUndefined } from "../../../utils/strings"
import DropdownItem from "../../elements/DropdownItem"
import { GRAPHS_THAT_HAVE_BARMODE, GRAPHS_THAT_HAVE_HISTFUNC, GRAPHS_THAT_HAVE_LINE_SHAPE, GRAPHS_THAT_HAVE_POINTS, GraphType, GRAPH_SAFETY_FILTER_CUTOFF } from "./GraphSetupTab"
import { MitoAPI, getRandomId } from "../../../api/api"
import { TaskpaneType } from "../taskpanes"

// Note: these should match the constants in Python as well
const DO_NOT_CHANGE_PAPER_BGCOLOR_DEFAULT = '#FFFFFF'
const DO_NOT_CHANGE_PLOT_BGCOLOR_DEFAULT = '#E6EBF5'
const DO_NOT_CHANGE_TITLE_FONT_COLOR_DEFAULT = '#2F3E5D'

const getAxisColumnIDs = (graphType?: GraphType, selectedColumnIds?: ColumnID[]): {
    x_axis_column_ids: ColumnID[],
    y_axis_column_ids: ColumnID[]
} => {
    if (selectedColumnIds === undefined) {
        return {
            x_axis_column_ids: [],
            y_axis_column_ids: []
        }
    }
    if (graphType === GraphType.SCATTER) {
        if (selectedColumnIds.length === 1) {
            return {
                x_axis_column_ids: [],
                y_axis_column_ids: selectedColumnIds
            }
        } else {
            return {
                x_axis_column_ids: [selectedColumnIds[0]],
                y_axis_column_ids: selectedColumnIds.slice(1)
            }
        }
    } else {
        return {
            x_axis_column_ids: [],
            y_axis_column_ids: selectedColumnIds
        }
    }
}


// unless a graph type is provided
export const getDefaultGraphParams = (sheetDataArray: SheetData[], sheetIndex: number, graphType?: GraphType, selectedColumnIds?: ColumnID[]): GraphParamsFrontend => {
    graphType = graphType || GraphType.BAR
    const axis_column_ids = getAxisColumnIDs(graphType, selectedColumnIds)
    return {
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
        }
    }
}



// Helper function for getting the default safety filter status
export const getDefaultSafetyFilter = (sheetDataArray: SheetData[], sheetIndex: number): boolean => {
    return sheetDataArray[sheetIndex] === undefined || sheetDataArray[sheetIndex].numRows > GRAPH_SAFETY_FILTER_CUTOFF
}

/*
    A helper function for getting the params for the graph for this sheet when
    opening the graphing taskpane, or when switching to a sheet.

    Notably, will filter oout any columns that are no longer in the dataset, 
    which stops the user from having invalid columns selected in their graph
    params.
*/
export const getGraphParams = (   
    graphDataDict: GraphDataDict,
    graphID: GraphID,
    selectedSheetIndex: number,
    sheetDataArray: SheetData[],
    selectedColumnIds?: ColumnID[]
): GraphParamsFrontend => {

    const graphParamsCopy: GraphParamsFrontend = window.structuredClone(graphDataDict[graphID]?.graphParams); 

    // If the graph already exists, get the data source sheet index from the graph params.
    // Otherwise create a new graph of the selectedSheetIndex
    const graphDataSourceSheetIndex = graphParamsCopy !== undefined ? graphParamsCopy.graphCreation.sheet_index : selectedSheetIndex

    // If the graph already exists, retrieve the graph params that still make sense. In other words, 
    // if a column was previously included in the graph and it no longer exists, remove it from the graph. 
    if (graphParamsCopy !== undefined) {
        // Filter out column headers that no longer exist
        const validColumnIDs = sheetDataArray[graphDataSourceSheetIndex] !== undefined ? sheetDataArray[graphDataSourceSheetIndex].data.map(c => c.columnID) : [];
        const xAxisColumnIDs = intersection(
            validColumnIDs,
            graphParamsCopy.graphCreation.x_axis_column_ids
        )
        const yAxisColumnIDs = intersection(
            validColumnIDs,
            graphParamsCopy.graphCreation.y_axis_column_ids
        )
        const color = graphParamsCopy.graphCreation.color !== undefined && validColumnIDs.includes(graphParamsCopy.graphCreation.color) ? graphParamsCopy.graphCreation.color : undefined

        
        return {
            ...graphParamsCopy,
            graphCreation: {
                ...graphParamsCopy.graphCreation,
                x_axis_column_ids: xAxisColumnIDs,
                y_axis_column_ids: yAxisColumnIDs,
                color: color
            }
        }
    }

    // If the graph does not already exist, create a default graph.
    return getDefaultGraphParams(sheetDataArray, graphDataSourceSheetIndex, undefined, selectedColumnIds);
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

export const convertFrontendtoBackendGraphParams = (graphParamsFrontend: GraphParamsFrontend): GraphParamsBackend => {
    const graphCreationParams = graphParamsFrontend.graphCreation
    const graphStylingParams = graphParamsFrontend.graphStyling

    const x =  {
        ...graphParamsFrontend,
        graphCreation: {
            ...graphParamsFrontend.graphCreation,
            facet_col_wrap: convertStringToFloatOrUndefined(graphCreationParams.facet_col_wrap),
            facet_col_spacing: convertStringToFloatOrUndefined(graphCreationParams.facet_col_spacing),
            facet_row_spacing: convertStringToFloatOrUndefined(graphCreationParams.facet_row_spacing),
            nbins: convertStringToFloatOrUndefined(graphCreationParams.nbins),
        },
        graphStyling: {
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
        }
    }

    return x
}

export const convertBackendtoFrontendGraphParams = (graphParamsFrontend: GraphParamsBackend): GraphParamsFrontend => {
    const graphCreationParams = graphParamsFrontend.graphCreation
    const graphStylingParams = graphParamsFrontend.graphStyling

    return {
        ...graphParamsFrontend,
        graphCreation: {
            ...graphParamsFrontend.graphCreation,
            facet_col_wrap: convertToStringOrUndefined(graphCreationParams.facet_col_wrap),
            facet_col_spacing: convertToStringOrUndefined(graphCreationParams.facet_col_spacing),
            facet_row_spacing: convertToStringOrUndefined(graphCreationParams.facet_row_spacing),
            nbins: convertToStringOrUndefined(graphCreationParams.nbins)
        },
        graphStyling: {
            ...graphParamsFrontend.graphStyling,
            xaxis: {
                ...graphParamsFrontend.graphStyling.xaxis,
                gridwidth: convertToStringOrUndefined(graphStylingParams.xaxis.gridwidth)
            },
            yaxis: {
                ...graphParamsFrontend.graphStyling.yaxis,
                gridwidth: convertToStringOrUndefined(graphStylingParams.yaxis.gridwidth)
            },
            legend: {
                ...graphParamsFrontend.graphStyling.legend,
                x: convertToStringOrUndefined(graphStylingParams.legend.x),
                y: convertToStringOrUndefined(graphStylingParams.legend.y)
            }
        }
    }
}

export const openGraphEditor = 
    async (
        setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>,
        sheetDataArray: SheetData[],
        setUIState: React.Dispatch<React.SetStateAction<UIState>>,
        sheetIndex: number,
        mitoAPI: MitoAPI,
        graphType?: GraphType,
        selectedColumnIds?: ColumnID[]
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

        const newGraphID = getRandomId() // Create a new GraphID
        const graphParams = getDefaultGraphParams(sheetDataArray, sheetIndex, graphType, selectedColumnIds)

        await mitoAPI.editGraph(
            newGraphID,
            graphParams,
            '100%',
            '100%',
            getRandomId(), 
        );
    }