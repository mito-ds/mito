// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css"
import { classNames } from '../../../utils/classNames';

/*
    A container for the main content of a taskpane. Usually wrapped in 
    a DefaultTaskpane.
*/
const DefaultTaskpaneBody = (
    props: {
        /** 
            * @param children - The actual content to display in the body
        */
        children: ReactNode
        /** 
            * @param [noScroll] - Set to true if you don't want the body to be scrollable
        */
        noScroll?: boolean;
    }): JSX.Element => {

    return (
        <div className={classNames('default-taskpane-body-div', props.noScroll ? 'default-taskpane-body-div-no-scroll' : '')}> 
            {props.children}
        </div>
    )
};

export default DefaultTaskpaneBody;