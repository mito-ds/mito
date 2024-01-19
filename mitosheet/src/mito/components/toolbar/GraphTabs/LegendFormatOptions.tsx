import React from "react";
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";
import Input from "../../elements/Input";
import Toggle from "../../elements/Toggle";

export const LegendFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <div className='graph-element-style-options'>
        <div className='horizontal-input-with-label'>
            <p>X Position</p>
            <Input
                type='number'
                value={`${props.params?.graph_styling?.legend.x ?? ''}`}
                onChange={(e) => {
                    if (+e.target.value > 0) {
                        props.updateGraphParam({
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
                value={`${props.params?.graph_styling?.legend.y ?? ''}`}
                onChange={(e) => {
                    if (+e.target.value > 0) {
                        props.updateGraphParam({
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
                value={!!props.params?.graph_styling?.showlegend}
                onChange={() => {
                    props.updateGraphParam({
                        graph_styling: {
                            showlegend: !props.params?.graph_styling?.showlegend
                        }
                    })
                }}
            />
        </div>
    </div>
}