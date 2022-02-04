// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css"
import { classNames } from '../../../utils/classNames';

export enum TaskpaneSize {
    ENTIRE = 'entire',
    WIDE = 'wide',
    NARROW = 'narrow'
}

/*
    TODO
*/
const DefaultTaskpaneBody = (
    props: {
        children: ReactNode

        /* 
            Set this to false if you do not want th default taskpane
            to be scrollable
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