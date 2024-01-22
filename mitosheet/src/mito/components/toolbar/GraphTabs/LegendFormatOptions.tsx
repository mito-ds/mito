import React from "react";
import { GraphParamsBackend } from "../../..";
import { RecursivePartial } from "../../../types";
import Input from "../../elements/Input";

export const LegendFormatOptions = (props: {
    params?: GraphParamsBackend;
    updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
}) => {
    const [xPos, setXPos] = React.useState<string>(`${props.params?.graph_styling?.legend.x ?? ''}`); // [xPos, setXPos
    const [yPos, setYPos] = React.useState<string>(`${props.params?.graph_styling?.legend.y ?? ''}`);
    return <div className='graph-element-style-options'>
        <div className='horizontal-input-with-label'>
            <p>X Position (-2 to 3)</p>
            <Input
                type='number'
                value={xPos}
                width="small"
                onChange={(e) => {
                    setXPos(e.target.value);
                    props.updateGraphParam({
                        graph_styling: {
                            legend: {
                                x: +e.target.value
                            }
                        }
                    })
                }}
            />
        </div>
        <div className='horizontal-input-with-label'>
            <p>Y Position (-2 to 3)</p>
            <Input
                type='number'
                value={`${yPos ?? ''}`}
                width="small"
                onChange={(e) => {
                    setYPos(e.target.value);
                    props.updateGraphParam({
                        graph_styling: {
                            legend: {
                                y: +e.target.value
                            }
                        }
                    })
                }}
            />
        </div>
    </div>
}