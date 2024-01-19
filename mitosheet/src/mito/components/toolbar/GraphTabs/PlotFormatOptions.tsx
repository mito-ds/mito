import React from "react"
import ColorInput from "../../elements/ColorInput"
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";

export const PlotFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <div className='graph-element-style-options mito-toolbar-button-container-enabled vertical-align-content'>
    <ColorInput
        value={props.params?.graph_styling?.plot_bgcolor ?? ''}
        onChange={(value) => {
            props.updateGraphParam({
                graph_styling: {
                    plot_bgcolor: value
                }
            })
        }}
        type='background-color'
    />
    <p>Fill</p>
</div>
}