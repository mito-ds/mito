/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { AnalysisData, GraphParamsBackend, MitoAPI, SheetData } from "../../..";
import { ActionEnum, ColumnID, GraphOutput, RecursivePartial, UIState } from "../../../types";
import { Actions } from "../../../utils/actions";
import ToolbarButton from "./../ToolbarButton";
import Dropdown from "../../elements/Dropdown";
import DropdownItem from "../../elements/DropdownItem";
import AxisTitlesIcon from "../../icons/GraphToolbar/AxisTitlesIcon";
import ChartTitleIcon from "../../icons/GraphToolbar/ChartTitleIcon";
import EditIcon from "../../icons/EditIcon";
import LegendIcon from "../../icons/GraphToolbar/LegendIcon";
import GridlinesIcon from "../../icons/GraphToolbar/GridlinesIcon";
import RangeSliderIcon from "../../icons/GraphToolbar/RangeSliderIcon";
import { getGraphElementObjects, getGraphElementInfoFromHTMLElement } from "../../taskpanes/Graph/graphUtils";

type AddChartElementSubMenus = 'axis-titles' | 'chart-title' | 'legend' | 'grid-lines' | 'range-slider';

export const AddChartElementButton = (
    props: {
        actions: Actions;
        uiState: UIState;
        mitoAPI: MitoAPI;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        analysisData: AnalysisData;
        sheetDataArray: SheetData[];
        selectedColumnsIds?: ColumnID[];
        mitoContainerRef: React.RefObject<HTMLDivElement>;
        graphOutput: GraphOutput;
        params?: GraphParamsBackend;
        updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
    }): JSX.Element => {
    const [ currOpenSubmenu, setCurrOpenSubmenu ] = React.useState<AddChartElementSubMenus | undefined>(undefined);
    const graphStylingParams = props.params?.graph_styling;

    return <ToolbarButton
        action={props.actions.buildTimeActions[ActionEnum.AddChartElementDropdown]}
    >
        <Dropdown
            display={props.uiState.currOpenDropdown === 'add-chart-element'}
            closeDropdown={() => {
                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: (prevUIState.currOpenDropdown === 'add-chart-element') ? undefined : prevUIState.currOpenDropdown,
                    }
                })
            }}
        >
            <DropdownItem
                title='Axis Titles'
                icon={<AxisTitlesIcon/>}
                canHaveCheckMark
                onMouseEnter={() => setCurrOpenSubmenu('axis-titles')}
                subMenu={
                    <Dropdown
                        display={currOpenSubmenu === 'axis-titles'}
                        position='horizontal'
                        closeDropdown={() => setCurrOpenSubmenu(undefined)}
                    >
                        <DropdownItem
                            title='Horizontal'
                            icon={<AxisTitlesIcon axis='horizontal'/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.xaxis.visible}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: {xaxis: {visible: !graphStylingParams?.xaxis.visible}}});
                            }}
                        />
                        <DropdownItem
                            title='Vertical'
                            icon={<AxisTitlesIcon axis='vertical'/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.yaxis.visible}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: {yaxis: {visible: !graphStylingParams?.yaxis.visible}}});
                            }}
                        />
                        <DropdownItem
                            title='Edit X Axis Title'
                            icon={<AxisTitlesIcon axis="horizontal"/>}
                            canHaveCheckMark
                            supressFocusSettingOnClose
                            onClick={() => {
                                const graphElementObjects = getGraphElementObjects(props.graphOutput);
                                if (graphElementObjects === undefined) {
                                    return;
                                }
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenDropdown: undefined,
                                        currOpenTaskpane: { 
                                            ...prevUIState.currOpenTaskpane, 
                                            currentGraphElement: getGraphElementInfoFromHTMLElement(graphElementObjects.xtitle, 'xtitle', props.graphOutput, props.mitoContainerRef?.current, 'popup-title-editor')
                                        },
                                    }
                                })
                            }}
                        />
                        <DropdownItem
                            title='Edit Y Axis Title'
                            icon={<AxisTitlesIcon axis="vertical"/>}
                            canHaveCheckMark
                            supressFocusSettingOnClose
                            onClick={() => {
                                const graphElementObjects = getGraphElementObjects(props.graphOutput);
                                if (graphElementObjects === undefined) {
                                    return;
                                }
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenDropdown: undefined,
                                        currOpenTaskpane: { 
                                            ...prevUIState.currOpenTaskpane, 
                                            currentGraphElement: getGraphElementInfoFromHTMLElement(graphElementObjects.ytitle, 'ytitle', props.graphOutput, props.mitoContainerRef?.current, 'popup-title-editor')
                                        },
                                    }
                                })
                            }}
                        />
                    </Dropdown>
                }
            />
            <DropdownItem
                title='Chart Title'
                icon={<ChartTitleIcon/>}
                canHaveCheckMark
                onMouseEnter={() => setCurrOpenSubmenu('chart-title')}
                subMenu={
                    <Dropdown
                        display={currOpenSubmenu === 'chart-title'}
                        position='horizontal'
                        closeDropdown={() => setCurrOpenSubmenu(undefined)}
                    >
                        <DropdownItem
                            title='Display Title'
                            icon={<ChartTitleIcon/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.title.visible}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: {title: {visible: !graphStylingParams?.title.visible}}});
                            }}
                        />
                        <DropdownItem
                            title='Edit Title'
                            icon={<EditIcon/>}
                            supressFocusSettingOnClose
                            canHaveCheckMark
                            onClick={() => {
                                const graphElementObjects = getGraphElementObjects(props.graphOutput);
                                if (graphElementObjects === undefined) {
                                    return;
                                }
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenDropdown: undefined,
                                        currOpenTaskpane: { 
                                            ...prevUIState.currOpenTaskpane, 
                                            currentGraphElement: getGraphElementInfoFromHTMLElement(graphElementObjects.gtitle, 'gtitle', props.graphOutput, props.mitoContainerRef?.current, 'popup-title-editor')
                                        },
                                    }
                                })
                            }}
                        />
                    </Dropdown>
                }
            />
            <DropdownItem
                title='Legend'
                icon={<LegendIcon/>}
                canHaveCheckMark
                onMouseEnter={() => setCurrOpenSubmenu('legend')}
                subMenu={
                    <Dropdown
                        display={currOpenSubmenu === 'legend'}
                        position='horizontal'
                        closeDropdown={() => setCurrOpenSubmenu(undefined)}
                    >
                        <DropdownItem
                            title='None'
                            icon={<LegendIcon orientation='none'/>}
                            canHaveCheckMark
                            hasCheckMark={!graphStylingParams?.showlegend}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { showlegend: !graphStylingParams?.showlegend }});
                            }}
                        />
                        <DropdownItem
                            title='Vertical'
                            icon={<LegendIcon orientation='vertical'/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.showlegend && graphStylingParams?.legend.orientation === 'v'}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { showlegend: true, legend: { orientation: 'v' }}});
                            }}
                        />
                        <DropdownItem
                            title='Horizontal'
                            icon={<LegendIcon orientation='horizontal'/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.showlegend && graphStylingParams?.legend.orientation === 'h'}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { showlegend: true, legend: { orientation: 'h' }}});
                            }}
                        />
                    </Dropdown>
                }
            />
            <DropdownItem
                title='Grid Lines'
                icon={<GridlinesIcon/>}
                canHaveCheckMark
                onMouseEnter={() => setCurrOpenSubmenu('grid-lines')}
                subMenu={
                    <Dropdown
                        display={currOpenSubmenu === 'grid-lines'}
                        position='horizontal'
                        closeDropdown={() => setCurrOpenSubmenu(undefined)}
                    >
                        <DropdownItem
                            title='None'
                            icon={<GridlinesIcon orientation="none"/>}
                            canHaveCheckMark
                            hasCheckMark={!graphStylingParams?.xaxis.showgrid && !graphStylingParams?.yaxis.showgrid}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { xaxis: { showgrid: false }, yaxis: { showgrid: false }}});
                            }}
                        />
                        <DropdownItem
                            title='Vertical'
                            icon={<GridlinesIcon orientation="vertical"/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.xaxis.showgrid}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { xaxis: { showgrid: !graphStylingParams?.xaxis.showgrid }}});
                            }}
                        />
                        <DropdownItem
                            title='Horizontal'
                            icon={<GridlinesIcon orientation="horizontal"/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.yaxis.showgrid}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { yaxis: { showgrid: !graphStylingParams?.yaxis.showgrid }}});
                            }}
                        />
                    </Dropdown>
                }
            />
            <DropdownItem
                title='Show Range Slider'
                icon={<RangeSliderIcon/>}
                canHaveCheckMark
                onMouseEnter={() => setCurrOpenSubmenu('range-slider')}
                subMenu={
                    <Dropdown
                        display={currOpenSubmenu === 'range-slider'}
                        position='horizontal'
                        closeDropdown={() => setCurrOpenSubmenu(undefined)}
                    >
                        <DropdownItem
                            title='None'
                            icon={<RangeSliderIcon hasRangeSlider={false}/>}
                            canHaveCheckMark
                            hasCheckMark={!graphStylingParams?.xaxis.rangeslider.visible}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { xaxis: { rangeslider: { visible: false }}}});
                            }}
                        />
                        <DropdownItem
                            title='Horizontal'
                            icon={<RangeSliderIcon/>}
                            canHaveCheckMark
                            hasCheckMark={graphStylingParams?.xaxis.rangeslider.visible}
                            onClick={() => {
                                return props.updateGraphParam({graph_styling: { xaxis: { rangeslider: { visible: true }}}});
                            }}
                        />
                    </Dropdown>
                }
            />
        </Dropdown>
    </ToolbarButton>;
}
