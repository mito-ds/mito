import React from "react";
import { AnalysisData, GraphParamsBackend, MitoAPI, SheetData } from "../..";
import { ActionEnum, ColumnID, RecursivePartial, UIState } from "../../types";
import { Actions } from "../../utils/actions";
import Dropdown from "../elements/Dropdown";
import DropdownItem from "../elements/DropdownItem";
import GraphIcon from "../icons/GraphIcon";
import LineChartIcon from "../icons/LineChartIcon";
import ScatterPlotIcon from "../icons/ScatterPlotIcon";
import { GraphType } from "../taskpanes/Graph/GraphSetupTab";
import ToolbarButton from "./ToolbarButton";


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
    const graphTypeOptions: {
        value: GraphType,
        label: string,
        icon: React.FC<any>
    }[] = [
        {
            value: GraphType.BAR,
            label: 'Bar',
            icon: GraphIcon,
        },
        {
            value: GraphType.LINE,
            label: 'Line',
            icon: LineChartIcon,
        },
        {
            value: GraphType.SCATTER,
            label: 'Scatter',
            icon: ScatterPlotIcon,
        },
        {
            value: GraphType.BOX,
            label: 'Box',
            icon: GraphIcon,
        },
        {
            value: GraphType.VIOLIN,
            label: 'Violin',
            icon: GraphIcon,
        },
        {
            value: GraphType.HISTOGRAM,
            label: 'Histogram',
            icon: GraphIcon,
        },
        {
            value: GraphType.DENSITY_HEATMAP,
            label: 'Density Heatmap',
            icon: GraphIcon,
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
                if (props.uiState.currOpenDropdown === 'change-chart-type') {
                    props.setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenDropdown: undefined,
                        }
                    })
                }
            }}
        >
            {graphTypeOptions.map((option) => {
                return <DropdownItem
                    title={option.label}
                    icon={<option.icon />}
                    canHaveCheckMark
                    hasCheckMark={option.value === graphType}
                    onClick={() => {
                        return setGraphType(option.value);
                    }}
                />
            })}
        </Dropdown>
    </ToolbarButton>;
}
