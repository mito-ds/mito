import React from "react";
import { AnalysisData, GraphParamsBackend, MitoAPI, SheetData } from "../../..";
import { ActionEnum, ColumnID, RecursivePartial, UIState } from "../../../types";
import { Actions } from "../../../utils/actions";
import Dropdown from "../../elements/Dropdown";
import DropdownItem from "../../elements/DropdownItem";
import GraphIcon from "../../icons/GraphIcon";
import LineChartIcon from "../../icons/LineChartIcon";
import ScatterPlotIcon from "../../icons/ScatterPlotIcon";
import { GraphType } from "../../taskpanes/Graph/GraphSetupTab";
import ToolbarButton from "./../ToolbarButton";
import BoxGraphIcon from "../../icons/GraphToolbar/BoxGraphIcon";
import HistogramIcon from "../../icons/GraphToolbar/HistogramIcon";
import HeatMapIcon from "../../icons/GraphToolbar/HeatMapIcon";
import DensityContourIcon from "../../icons/GraphToolbar/DensityContourIcon";
import GroupIcon from "../../icons/GraphToolbar/GroupIcon";
import StackedIcon from "../../icons/GraphToolbar/StackedIcon";
import NormalizedIcon from "../../icons/GraphToolbar/NormalizedIcon";
import LineChartSubMenuIcon from "../../icons/GraphToolbar/LineChartSubMenuIcons";
import OverlayIcon from "../../icons/GraphToolbar/OverlayIcon";
import BoxPlotSubMenuIcon from "../../icons/GraphToolbar/BoxPlotSubMenuIcon";


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

/**
 * This function is used to switch the x and y axes if the graph is being set to favor a certain axis.
 * So, if there are multiple columns in the X axis and we set primaryAxis = 'y', then the x and y axes
 * will be switched.
 */
const getXandYColumnIDs = (primaryAxis: 'x' | 'y', x_axis_column_ids?: ColumnID[], y_axis_column_ids?: ColumnID[]): [ColumnID[] | undefined, ColumnID[] | undefined] => {
    if (primaryAxis === 'x') {
        // Only switch if there are more columns in the y axis than in the x axis
        if ((y_axis_column_ids?.length ?? 0) > (x_axis_column_ids?.length ?? 0)) {
            const tmp_y_axis_column_ids = x_axis_column_ids;
            x_axis_column_ids = y_axis_column_ids;
            y_axis_column_ids = tmp_y_axis_column_ids;
        }
    } else {
        // Only switch if there are more columns in the x axis than in the y axis
        if ((x_axis_column_ids?.length ?? 0) > (y_axis_column_ids?.length ?? 0)) {
            const tmp_x_axis_column_ids = x_axis_column_ids;
            x_axis_column_ids = y_axis_column_ids;
            y_axis_column_ids = tmp_x_axis_column_ids;
        }
    }
    return [x_axis_column_ids, y_axis_column_ids];
}

export const ChangeChartTypeButton = (
    props: {
        actions: Actions;
        uiState: UIState;
        mitoAPI: MitoAPI;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        analysisData: AnalysisData;
        sheetDataArray: SheetData[];
        selectedColumnsIds?: ColumnID[];
        mitoContainerRef: React.RefObject<HTMLDivElement>;
        params?: GraphParamsBackend;
        updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
    }): JSX.Element => {
    const graphType = props.params?.graph_creation?.graph_type ?? GraphType.BAR;
    const [currDropdown, setCurrDropdown] = React.useState<GraphType | undefined>(undefined);
    const updateGraphParams = (newParams: RecursivePartial<GraphParamsBackend>) => {
        // This function is used to update the graph params specifically if the graph type is being changed
        const newGraphType = newParams.graph_creation?.graph_type ?? graphType;
        if (newGraphType !== graphType) {
            // Update the graph type and reset params that are only available for some graph types
            props.updateGraphParam({
                ...newParams,
                graph_creation: {
                    graph_type: newGraphType,
                    color: GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(newGraphType) ? undefined : props.params?.graph_creation?.color,
                    points: GRAPHS_THAT_HAVE_POINTS.includes(newGraphType) ? 'outliers' : undefined,
                    line_shape: GRAPHS_THAT_HAVE_LINE_SHAPE.includes(newGraphType) ? 'linear' : undefined,
                    nbins: undefined,
                    histnorm: undefined,
                    histfunc: GRAPHS_THAT_HAVE_HISTFUNC.includes(newGraphType) ? 'count' : undefined,
                    ...newParams?.graph_creation
                },
                graph_styling: {
                    barmode: GRAPHS_THAT_HAVE_BARMODE.includes(newGraphType) ? 'group' : undefined,
                    barnorm: undefined,
                    ...newParams?.graph_styling 
                }
            })
        } else {
            props.updateGraphParam(newParams);
        }
    }
    const graphTypeOptions: {
        value: GraphType,
        label: string,
        subMenu?: JSX.Element,
        isSelected?: boolean,
        icon: React.FC<any>
    }[] = [
        {
            value: GraphType.BAR,
            label: 'Bar',
            icon: GraphIcon,
            subMenu: <Dropdown layout="vertical" position="horizontal" display={currDropdown === 'bar'} closeDropdown={() => {
                if (currDropdown === 'bar') {
                    setCurrDropdown(undefined);
                }
            }}>
                <DropdownItem
                    key='grouped_x'
                    title='Grouped'
                    icon={<GroupIcon />}
                    tooltip="Grouped"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'group',
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='stacked_x'
                    title='Stacked'
                    icon={<StackedIcon />}
                    tooltip="Stacked"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='normalized_x'
                    title='Normalized'
                    icon={<NormalizedIcon />}
                    tooltip="Normalized"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative',
                                barnorm: 'percent'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='grouped_y'
                    title='Grouped'
                    icon={<GroupIcon axis="y" />}
                    tooltip="Grouped"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'group'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='stacked_y'
                    title='Stacked'
                    icon={<StackedIcon axis="y" />}
                    tooltip="Grouped"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'group',
                                barnorm: undefined
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='normalized_y'
                    title='Normalized'
                    icon={<NormalizedIcon axis="y" />}
                    tooltip="Normalized"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative',
                                barnorm: 'percent'
                            }
                        })
                    }}
                />
            </Dropdown>
        },
        {
            value: GraphType.LINE,
            label: 'Line',
            icon: LineChartIcon,
            subMenu: <Dropdown layout="vertical" position="horizontal" width="hug-contents" display={currDropdown === 'line'} closeDropdown={() => {
                if (currDropdown === 'line') {
                    setCurrDropdown(undefined);
                }
            }}>
                <DropdownItem
                    key='linear'
                    title='Linear'
                    icon={<LineChartSubMenuIcon type="linear" />}
                    tooltip="Linear"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                line_shape: 'linear',
                                graph_type: GraphType.LINE
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='horizontal'
                    title='Horizontal'
                    icon={<LineChartSubMenuIcon type="horizontal" />}
                    tooltip="Horizontal"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                line_shape: 'hv',
                                graph_type: GraphType.LINE
                            }
                        })
                    }}
                />
            </Dropdown>
        },
        {
            value: GraphType.SCATTER,
            label: 'Scatter',
            icon: ScatterPlotIcon,
        },
        {
            value: GraphType.HISTOGRAM,
            label: 'Histogram',
            icon: HistogramIcon,
            subMenu: <Dropdown layout="vertical" position="horizontal" style={{ width: '445px' }} display={currDropdown === 'histogram'} closeDropdown={() => {
                if (currDropdown === 'histogram') {
                    setCurrDropdown(undefined);
                }
            }}><DropdownItem
                    key='grouped_x'
                    title='Grouped'
                    icon={<GroupIcon />}
                    tooltip="Grouped"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'group'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='stacked_x'
                    title='Stacked'
                    icon={<StackedIcon />}
                    tooltip="Stacked"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='overlay_x'
                    title='Overlay'
                    icon={<OverlayIcon axis='x' />}
                    tooltip="Overlay"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'overlay'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='normalized_x'
                    title='Normalized'
                    icon={<NormalizedIcon />}
                    tooltip="Normalized"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('x', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative',
                                barnorm: 'percent'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='grouped_y'
                    title='Grouped'
                    icon={<GroupIcon axis="y" />}
                    tooltip="Grouped"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'group'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='stacked_y'
                    title='Stacked'
                    icon={<StackedIcon axis="y" />}
                    tooltip="Stacked"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='overlay_y'
                    title='Overlay'
                    icon={<OverlayIcon axis="y" />}
                    tooltip="Overlay"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'overlay'
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='normalized_y'
                    title='Normalized'
                    icon={<NormalizedIcon axis="y" />}
                    tooltip="Normalized"
                    onClick={() => {
                        const [x_axis_column_ids, y_axis_column_ids] = getXandYColumnIDs('y', props.params?.graph_creation?.x_axis_column_ids, props.params?.graph_creation?.y_axis_column_ids);
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM,
                                x_axis_column_ids,
                                y_axis_column_ids
                            },
                            graph_styling: {
                                barmode: 'relative',
                                barnorm: 'percent'
                            }
                        })
                    }}
                />
            </Dropdown>
        },
        {
            value: GraphType.BOX,
            label: 'Box',
            icon: BoxGraphIcon,
            isSelected: graphType === GraphType.BOX || graphType === GraphType.VIOLIN || graphType === GraphType.ECDF,
            subMenu: <Dropdown layout="vertical" position="horizontal" display={currDropdown === 'box'} closeDropdown={() => {
                if (currDropdown === 'box') {
                    setCurrDropdown(undefined);
                }
            }}>
                <DropdownItem
                    key='box'
                    title='Box'
                    icon={<BoxPlotSubMenuIcon type='box' />}
                    tooltip="Box"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.BOX
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='violin'
                    title='Violin'
                    icon={<BoxPlotSubMenuIcon type='violin' />}
                    tooltip="Violin"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.VIOLIN
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='ecdf'
                    title='ECDF'
                    icon={<BoxPlotSubMenuIcon type='ecdf' />}
                    tooltip="ECDF"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.ECDF
                            }
                        })
                    }}
                />
            </Dropdown>
        },
        {
            value: GraphType.DENSITY_CONTOUR,
            label: 'Density',
            icon: DensityContourIcon,
            isSelected: graphType === GraphType.DENSITY_HEATMAP || graphType === GraphType.DENSITY_CONTOUR,
            subMenu: <Dropdown layout="vertical" position="horizontal" width="hug-contents" display={currDropdown === GraphType.DENSITY_CONTOUR} closeDropdown={() => {
                if (currDropdown === GraphType.DENSITY_HEATMAP) {
                    setCurrDropdown(undefined);
                }
            }}>
                <DropdownItem
                    key='heatmap'
                    title='Heatmap'
                    icon={<HeatMapIcon width='45px' />}
                    tooltip="Heatmap"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.DENSITY_HEATMAP
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='contour'
                    title='Contour'
                    icon={<DensityContourIcon width="45px" />}
                    tooltip="Density Contour"
                    onClick={() => {
                        updateGraphParams({
                            graph_creation: {
                                graph_type: GraphType.DENSITY_CONTOUR
                            }
                        })
                    }}
                />
            </Dropdown>
        }
    ]

    return <ToolbarButton
        action={props.actions.buildTimeActions[ActionEnum.ChangeChartTypeDropdown]}
    >
        <Dropdown
            display={props.uiState.currOpenDropdown === 'change-chart-type'}
            closeDropdown={() => {
                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: (prevUIState.currOpenDropdown === 'change-chart-type') ? undefined : prevUIState.currOpenDropdown,
                    }
                })
            }}
            width='medium'
        >
            {graphTypeOptions.map((option) => {
                return <DropdownItem
                    key={option.value}
                    title={option.label}
                    icon={<option.icon />}
                    canHaveCheckMark
                    hasCheckMark={option.isSelected ?? option.value === graphType}
                    onMouseEnter={() => {
                        setCurrDropdown(option.value)
                    }}
                    onClick={() => {
                        if (option.subMenu === undefined) {
                            return updateGraphParams({
                                graph_creation: {
                                    graph_type: option.value
                                }
                            });
                        }
                    }}
                    subMenu={option.subMenu}
                />
            })}
        </Dropdown>
    </ToolbarButton>;
}
