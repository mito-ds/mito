/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

interface SpacerProps {
    /** 
        * @param [px] - The number of pixels to space with
    */
    px: number;

    /**
     * @param [seperatingLine] - Whether or not to have a light gray line
     */
    seperatingLine?: boolean;
}


/**
 * A Spacer literally just takes up a set amount of vertical space.
 */ 
const Spacer = (props: SpacerProps): JSX.Element => {

    // We want the seperating line to be centered, so we add a bottom margin too, with half the margin on either side
    const px = props.seperatingLine ? props.px / 2 : props.px;

    const marginTop = `${px}px`;
    const border = props.seperatingLine ? '.5px solid var(--mito-text-light)' : 'none';
    const marginBottom = props.seperatingLine ? `${px}px` : 'none';


    return (
        <div style={{marginTop: marginTop, border: border, marginBottom: marginBottom}}/>
    )
} 

export default Spacer;