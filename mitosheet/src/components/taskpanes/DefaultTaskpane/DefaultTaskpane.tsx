// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css"

export enum TaskpaneSize {
    ENTIRE = 'entire',
    WIDE = 'wide',
    NARROW = 'narrow'
}

/*
    DefaultTaskpane is a higher-order component that
    takes a header and a taskpaneBbody, and displays it as a component.

    The modal has props (TODO)
    - a header string to be shown at the top of the taskpane
    - a taskpaneBody, a react fragment which is the center segment of the taskpane
    - a setTaskpaneOpenOrClosed function to close the taskpane
*/
const DefaultTaskpane = (
    props: {
        children: ReactNode;
        /* 
            TODO: add doc strings 
        */
        backgroundImage?: string;
        
    }): JSX.Element => {

    return (
        <div className='default-taskpane-div' style={{backgroundImage: props.backgroundImage}}>
            {props.children}
        </div>
    )
};

export default DefaultTaskpane;