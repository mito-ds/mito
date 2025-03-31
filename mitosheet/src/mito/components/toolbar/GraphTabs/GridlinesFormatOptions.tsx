/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";
import Input from "../../elements/Input";
import Toggle from "../../elements/Toggle";

export const GridlinesFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <>
        <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>Vertical Grid Width</p>
                <Input
                    type='number'
                    value={`${props.params?.graph_styling?.xaxis.gridwidth ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            props.updateGraphParam({
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
                    value={`${props.params?.graph_styling?.yaxis.gridwidth ?? ''}`}
                    onChange={(e) => {
                        if (+e.target.value > 0) {
                            props.updateGraphParam({
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
        </div>
        <div className='graph-element-style-options'>
            <div className='horizontal-input-with-label'>
                <p>Display Horizontal Gridlines</p>
                <Toggle
                    value={!!props.params?.graph_styling?.yaxis.showgrid}
                    onChange={() => {
                        props.updateGraphParam({
                            graph_styling: {
                                yaxis: {
                                    showgrid: !props.params?.graph_styling?.yaxis.showgrid
                                }
                            }
                        })
                    }}
                />
            </div>

            <div className='horizontal-input-with-label'>
                <p>Display Vertical Gridlines</p>
                <Toggle
                    value={!!props.params?.graph_styling?.xaxis.showgrid}
                    onChange={() => {
                        props.updateGraphParam({
                            graph_styling: {
                                xaxis: {
                                    showgrid: !props.params?.graph_styling?.xaxis.showgrid
                                }
                            }
                        })
                    }}
                />
            </div>
        </div>
    </>
}