/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react"
import ColorInput from "../../elements/ColorInput"
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";

export const ChartTitleFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <div className='graph-element-style-options mito-toolbar-button-container-enabled vertical-align-content'>
        <ColorInput
            value={props.params?.graph_styling?.title?.title_font_color ?? ''}
            onChange={(value) => {
                props.updateGraphParam({
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
    </div>
}