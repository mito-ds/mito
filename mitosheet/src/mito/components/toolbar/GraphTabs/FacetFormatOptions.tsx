import React from "react";
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";
import Input from "../../elements/Input";

export const FacetFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <div className='graph-element-style-options'>
        <div className='horizontal-input-with-label'>
            <p>Number of Columns</p>
            <Input
                type='number'
                value={`${props.params?.graph_creation?.facet_col_wrap ?? ''}`}
                onChange={(e) => {
                    if (+e.target.value > 0) {
                        props.updateGraphParam({
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
                value={`${props.params?.graph_creation?.facet_col_spacing ?? ''}`}
                onChange={(e) => {
                    if (+e.target.value > 0) {
                        props.updateGraphParam({
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
                value={`${props.params?.graph_creation?.facet_row_spacing ?? ''}`}
                onChange={(e) => {
                    if (+e.target.value > 0) {
                        props.updateGraphParam({
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