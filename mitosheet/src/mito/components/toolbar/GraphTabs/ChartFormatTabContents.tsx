// Copyright (c) Mito


import React from 'react';

import { GraphParamsBackend, MitoAPI } from '../../..';
import { AnalysisData, ColumnID, RecursivePartial, SheetData, UIState } from '../../../types';
import { Actions } from '../../../utils/actions';
import { updateObjectWithPartialObject } from '../../../utils/objects';
import DropdownItem from '../../elements/DropdownItem';
import Input from '../../elements/Input';
import Select from '../../elements/Select';
import { convertBackendtoFrontendGraphParams } from '../../taskpanes/Graph/graphUtils';
import { TaskpaneType } from '../../taskpanes/taskpanes';
import Toggle from '../../elements/Toggle';
import ColorInput from '../../elements/ColorInput';
import { AxisType } from '../../taskpanes/Graph/GraphStyleTab';

export const ChartFormatTabContents = (
    props: {
        actions: Actions;
        uiState: UIState;
        mitoAPI: MitoAPI;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        analysisData: AnalysisData;
        sheetDataArray: SheetData[];
        selectedColumnsIds?: ColumnID[];
        mitoContainerRef: React.RefObject<HTMLDivElement>;
    }): JSX.Element => {
    const currOpenTaskpane = props.uiState.currOpenTaskpane;
    if (currOpenTaskpane.type !== TaskpaneType.GRAPH) {
        throw new Error('ChartDesignTabContents should only be used when the graph taskpane is open.');
    }
    const openGraph = currOpenTaskpane.openGraph;
    
    // Get the step params and the step id of the currently open graph by getting the most recent step from this array
    // This is used in conjunction with useLiveUpdatingParams in the GraphSidebar with a special flag to add these edits
    // into the same step as useLiveUpdatingParams is using. This assumes that there is already a step in the stepSummaryList
    // for this graph.
    const stepSummaryList = props.analysisData.stepSummaryList;
    const currGraphStep = stepSummaryList[stepSummaryList.length - 1];
    const params = currGraphStep.params as GraphParamsBackend | undefined;

    // When edits happen, just call the API directly w/ the graph id and the step id
    const updateGraphParam = (update: RecursivePartial<GraphParamsBackend>): void => {
        if (params === undefined) {
            return;
        }
        void props.mitoAPI.editGraph(
            openGraph.graphID,
            convertBackendtoFrontendGraphParams(updateObjectWithPartialObject(params, update)),
            params.graph_rendering.height ?? '100%',
            params.graph_rendering.width ?? '100%',
            currGraphStep.step_id,
            true
        );
    }

    const elementOptions = ['Chart Title', 'Plot', 'Legend', 'Gridlines', 'Axes', 'Facet'];
    const [currElement, setCurrElement] = React.useState<typeof elementOptions[number]>('Chart Title');

    let optionsForElement: { [title: typeof elementOptions[number]]: JSX.Element } = {
        'Chart Title': <div className='graph-element-style-options mito-toolbar-button-container-enabled vertical-align-content'>
            <ColorInput
                value={params?.graph_styling?.title?.title_font_color ?? ''}
                onChange={(value) => {
                    updateGraphParam({
                        graph_styling: {
                            title: {
                                title_font_color: value
                            }
                        }
                    })
                }}
                type='font-color'
            />
            <p>Text Fill</p>
        </div>,
        'Plot': <div className='graph-element-style-options mito-toolbar-button-container-enabled vertical-align-content'>
            <ColorInput
                value={params?.graph_styling?.plot_bgcolor ?? ''}
                onChange={(value) => {
                    updateGraphParam({
                        graph_styling: {
                            plot_bgcolor: value
                        }
                    })
                }}
                type='background-color'
            />
            <p>Fill</p>
        </div>,
        'Legend': <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>X Position</p>
                <Input
                    type='number'
                    value={`${params?.graph_styling?.legend.x ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_styling: {
                                    legend: {
                                        x: +e.target.value
                                    }
                                }
                            })
                        }
                    }}
                />
            </div>
            <div className='horizontal-input-with-label'>
                <p>Y Position</p>
                <Input
                    type='number'
                    value={`${params?.graph_styling?.legend.y ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_styling: {
                                    legend: {
                                        y: +e.target.value
                                    }
                                }
                            })
                        }
                    }}
                />
            </div>
            <div className='horizontal-input-with-label'>
                <p>Display Legend</p>
                <Toggle
                    value={!!params?.graph_styling?.showlegend}
                    onChange={() => {
                        updateGraphParam({
                            graph_styling: {
                                showlegend: !params?.graph_styling?.showlegend
                            }
                        })
                    }}
                />
            </div>
        </div>,
        'Gridlines': <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>Vertical Grid Width</p>
                <Input
                    type='number'
                    value={`${params?.graph_styling?.xaxis.gridwidth ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_styling: {
                                    xaxis: {
                                        gridwidth: +e.target.value
                                    }
                                }
                            })
                        }
                    }}
                />
            </div>
            <div className='horizontal-input-with-label'>
                <p>Horizontal Grid Width</p>
                <Input
                    type='number'
                    value={`${params?.graph_styling?.yaxis.gridwidth ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_styling: {
                                    yaxis: {
                                        gridwidth: +e.target.value
                                    }
                                }
                            })
                        }
                    }}
                />
            </div>
            <div className='horizontal-input-with-label'>
                <p>Display Horizontal Gridlines</p>
                <Toggle
                    value={!!params?.graph_styling?.yaxis.showgrid}
                    onChange={() => {
                        updateGraphParam({
                            graph_styling: {
                                yaxis: {
                                    showgrid: !params?.graph_styling?.yaxis.showgrid
                                }
                            }
                        })
                    }}
                />
            </div>

            <div className='horizontal-input-with-label'>
                <p>Display Vertical Gridlines</p>
                <Toggle
                    value={!!params?.graph_styling?.xaxis.showgrid}
                    onChange={() => {
                        updateGraphParam({
                            graph_styling: {
                                xaxis: {
                                    showgrid: !params?.graph_styling?.xaxis.showgrid
                                }
                            }
                        })
                    }}
                />
            </div>
        </div>,
        'Axes': <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>X Axis Transform</p>
                <Select
                    value={params?.graph_styling?.xaxis.type ?? AxisType.DEFAULT}
                    onChange={(value) => {
                        updateGraphParam({
                            graph_styling: {
                                xaxis: {
                                    type: value
                                }
                            }
                        })
                    }}
                >
                    <DropdownItem
                        title={AxisType.DEFAULT}
                    />
                    <DropdownItem
                        title={AxisType.LINEAR}
                    />
                    <DropdownItem
                        title={AxisType.LOG}
                    />
                    <DropdownItem
                        title={AxisType.DATE}
                    />
                    <DropdownItem
                        title={AxisType.CATEGORY}
                    />
                </Select>
            </div>
            <div className='horizontal-input-with-label'>
                <p>Y Axis Transform</p>
                <Select
                    value={params?.graph_styling.yaxis.type ?? AxisType.DEFAULT}
                    onChange={(value) => {
                        updateGraphParam({
                            graph_styling: {
                                yaxis: {
                                    type: value
                                }
                            }
                        })
                    }}
                >
                    <DropdownItem
                        title={AxisType.DEFAULT}
                    />
                    <DropdownItem
                        title={AxisType.LINEAR}
                    />
                    <DropdownItem
                        title={AxisType.LOG}
                    />
                    <DropdownItem
                        title={AxisType.DATE}
                    />
                    <DropdownItem
                        title={AxisType.CATEGORY}
                    />
                </Select>
            </div>
        </div>,
        'Facet': <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>Number of Columns</p>
                <Input
                    type='number'
                    value={`${params?.graph_creation?.facet_col_wrap ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_creation: {
                                    facet_col_wrap: +e.target.value
                                }
                            })
                        }
                    }}
                />
            </div>

            <div className='horizontal-input-with-label'>
                <p>Column Spacing</p>
                <Input
                    type='number'
                    value={`${params?.graph_creation?.facet_col_spacing ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_creation: {
                                    facet_col_spacing: +e.target.value
                                }
                            })
                        }
                    }}
                />
            </div>

            <div className='horizontal-input-with-label'>
                <p>Row Spacing</p>
                <Input
                    type='number'
                    value={`${params?.graph_creation?.facet_row_spacing ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            updateGraphParam({
                                graph_creation: {
                                    facet_row_spacing: +e.target.value
                                }
                            })
                        }
                    }}
                />
            </div>
        </div>
    }

    return (<div className='mito-toolbar-bottom'>
        <Select
            display={props.uiState.currOpenDropdown === 'chart-format'}
            width='small'
            onChangeDisplay={(display) => {
                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenDropdown: display ? 'chart-format' : undefined
                    }
                })
            }}
            onChange={(value) => {
                setCurrElement(value as typeof elementOptions[number]);
            }}
            value={currElement}
        >
            { elementOptions.map((element, index) => 
                (<DropdownItem
                    key={index}
                    onClick={() => {
                        setCurrElement(element);
                    }}
                    title={element}
                />)
            ) }
        </Select>
        { optionsForElement[currElement] }        
    </div>);
}

