import React from "react";
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";
import DropdownItem from "../../elements/DropdownItem";
import Select from "../../elements/Select";
import { AxisType } from "../../taskpanes/Graph/GraphStyleTab";

export const AxesFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    return <div className='graph-element-style-options'>
        <div className='horizontal-input-with-label'>
            <p>X Axis Transform</p>
            <Select
                value={props.params?.graph_styling?.xaxis.type ?? AxisType.DEFAULT}
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
}