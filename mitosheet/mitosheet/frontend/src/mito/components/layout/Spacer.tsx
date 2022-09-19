// Copyright (c) Mito
import React from 'react';

interface SpacerProps {
    /** 
        * @param [px] - The number of pixels to space with
    */
    px?: number;
}


/**
 * A Spacer literally just takes up a set amount of vertical space.
 */ 
const Spacer = (props: SpacerProps): JSX.Element => {

    return (
        <div style={{marginTop: `${props.px}px`}}/>
    )
} 

export default Spacer;