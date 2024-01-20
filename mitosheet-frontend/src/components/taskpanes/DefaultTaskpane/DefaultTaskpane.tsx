// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css"

/*
    DefaultTaskpane is a higher-order component that usually takes a DefaultTaskpaneHeader
    and DefaultTaskpaneBody component as it's child.
*/
const DefaultTaskpane = (
    props: {
        children: ReactNode,
        ref?: React.RefObject<HTMLDivElement>
    }): JSX.Element => {

    return (
        <div className='default-taskpane-div' ref={props.ref}>
            {props.children}
        </div>
    )
};

export default DefaultTaskpane;