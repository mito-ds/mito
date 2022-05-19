// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css"

/*
    A container for the footer content of a taskpane. Helpful for ensuring the footer is always 
    visible even if the body needs to scroll.
*/
const DefaultTaskpaneFooter = (
    props: {
        /** 
            * @param children - The actual content to display in the body
        */
        children: ReactNode
    }): JSX.Element => {

    return (
        <div> 
            {props.children}
        </div>
    )
};

export default DefaultTaskpaneFooter;