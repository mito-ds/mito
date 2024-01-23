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
    const graphTypeOptions: {
        value: GraphType,
        label: string,
        subMenu?: JSX.Element,
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.BAR,
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.BAR,
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.BAR,
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.BAR,
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.BAR,
                            },
                            graph_styling: {
                                barmode: 'group'
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.BAR,
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
            subMenu: <Dropdown layout="vertical" position="horizontal" display={currDropdown === 'line'} closeDropdown={() => {
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
                        props.updateGraphParam({
                            graph_creation: {
                                line_shape: 'linear',
                                graph_type: GraphType.LINE
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='interpolated'
                    title='Interpolated'
                    icon={<LineChartSubMenuIcon type="interpolated" />}
                    tooltip="Interpolated"
                    onClick={() => {
                        props.updateGraphParam({
                            graph_creation: {
                                line_shape: 'spline',
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
                        props.updateGraphParam({
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
            subMenu: <Dropdown layout="vertical" position="horizontal" style={{ width: '426px' }} display={currDropdown === 'histogram'} closeDropdown={() => {
                if (currDropdown === 'histogram') {
                    setCurrDropdown(undefined);
                }
            }}><DropdownItem
                    key='grouped_x'
                    title='Grouped'
                    icon={<GroupIcon />}
                    tooltip="Grouped"
                    onClick={() => {
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                    icon={<StackedIcon />}
                    tooltip="Overlay"
                    onClick={() => {
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.HISTOGRAM
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
                        props.updateGraphParam({
                            graph_creation: {
                                points: undefined,
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
                        props.updateGraphParam({
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
                        props.updateGraphParam({
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
            subMenu: <Dropdown layout="vertical" position="horizontal" display={currDropdown === GraphType.DENSITY_CONTOUR} closeDropdown={() => {
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
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.DENSITY_HEATMAP
                            }
                        })
                    }}
                />
                <DropdownItem
                    key='contour'
                    title='Density Contour'
                    icon={<DensityContourIcon width="45px" />}
                    tooltip="Density Contour"
                    onClick={() => {
                        props.updateGraphParam({
                            graph_creation: {
                                graph_type: GraphType.DENSITY_CONTOUR
                            }
                        })
                    }}
                />
            </Dropdown>
        }
    ]


    const setGraphType = (graphType: GraphType) => {
        // Update the graph type and reset params that are only available for some graph types
        props.updateGraphParam({
            graph_creation: {
                graph_type: graphType,
                color: GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(graphType) ? undefined : props.params?.graph_creation.color,
                points: GRAPHS_THAT_HAVE_POINTS.includes(graphType) ? 'outliers' : undefined,
                line_shape: GRAPHS_THAT_HAVE_LINE_SHAPE.includes(graphType) ? 'linear' : undefined,
                nbins: undefined,
                histnorm: undefined,
                histfunc: GRAPHS_THAT_HAVE_HISTFUNC.includes(graphType) ? 'count' : undefined
            },
            graph_styling: {
                barmode: GRAPHS_THAT_HAVE_BARMODE.includes(graphType) ? 'group' : undefined,
                barnorm: undefined 
            }
        })
    }


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
                    hasCheckMark={option.value === graphType}
                    onMouseEnter={() => {
                        setCurrDropdown(option.value)
                    }}
                    onClick={() => {
                        // Only change the chart type on click if there is no sub menu
                        if (option.subMenu === undefined) {
                            return setGraphType(option.value);
                        }
                    }}
                    subMenu={option.subMenu}
                />
            })}
        </Dropdown>
    </ToolbarButton>;
}
