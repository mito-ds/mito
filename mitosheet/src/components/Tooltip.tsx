import React from 'react';

type TooltipProps = {
    tooltip: string;
    style?: React.CSSProperties;
};

export default function Tooltip(props: TooltipProps): JSX.Element {

    return (
        <div className="tooltip" style={props.style}>
            {props.tooltip}
        </div>  
    );
}