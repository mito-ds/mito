import React from "react";
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import ColorInput from "../../elements/ColorInput";

export enum AxisType {
    DEFAULT = '-',
    LINEAR = 'linear',
    LOG = 'log',
    CATEGORY = 'category',
    DATE = 'date',
}

export const AxesFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <>
        <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>X Axis Transform</p>
                <Select
                    value={props.params?.graph_styling?.xaxis.type ?? AxisType.DEFAULT}
                    width={'small'}
                    onChange={(value) => {
                        props.updateGraphParam({
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
                    value={props.params?.graph_styling.yaxis.type ?? AxisType.DEFAULT}
                    width={'small'}
                    onChange={(value) => {
                        props.updateGraphParam({
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
        </div>
        <div className='graph-element-style-options'>
            <div
                className='mito-toolbar-button-container mito-toolbar-button-container-enabled vertical-align-content'
                style={{ width: '60px', marginLeft: '10px' }}>    
                <ColorInput
                    value={props.params?.graph_styling?.xaxis?.title_font_color ?? ''}
                    onChange={(value) => {
                        props.updateGraphParam({
                            graph_styling: {
                                xaxis: {
                                    title_font_color: value
                                }
                            }
                        })
                    }}
                    id='x-axis-title-color'
                    type='font-color'
                />
                <p>X Axis Title Color</p>
            </div>
        </div>
        <div className='graph-element-style-options'>
            <div
                className='mito-toolbar-button-container mito-toolbar-button-container-enabled vertical-align-content'
                style={{ width: '60px', marginLeft: '5px' }}>
                <ColorInput
                    value={props.params?.graph_styling?.yaxis.title_font_color ?? ''}
                    onChange={(value) => {
                        props.updateGraphParam({
                            graph_styling: {
                                yaxis: {
                                    title_font_color: value
                                }
                            }
                        })
                    }}
                    type='font-color'
                    id='y-axis-title-color'
                />
                <p>Y Axis Title Color</p>
            </div>
        </div>
    </>
}