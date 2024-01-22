import React from "react"
import ColorInput from "../../elements/ColorInput"
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";

export const PlotFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <div className="graph-element-style-options" style={{ height: '70px'}}>
        <div style={{ marginRight: '5px' }} className='mito-toolbar-button-container-enabled vertical-align-content'>
            <ColorInput
                value={props.params?.graph_styling?.plot_bgcolor ?? ''}
                onChange={(value) => {
                    props.updateGraphParam({
                        graph_styling: {
                            plot_bgcolor: value
                        }
                    })
                }}
                id='plot-bgcolor'
                type='background-color'
            />
            <p style={{ textAlign: 'center' }}>Chart Interior</p>
        </div>
        <div className='mito-toolbar-button-container-enabled vertical-align-content'>
            <ColorInput
                value={props.params?.graph_styling?.paper_bgcolor ?? ''}
                onChange={(value) => {
                    props.updateGraphParam({
                        graph_styling: {
                            paper_bgcolor: value
                        }
                    })
                }}
                id='paper-bgcolor'
                type='background-color'
            />
            <p style={{ textAlign: 'center' }}>Chart Exterior</p>
        </div>
    </div>
}