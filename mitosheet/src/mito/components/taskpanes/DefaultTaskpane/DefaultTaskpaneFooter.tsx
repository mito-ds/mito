/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React, { ReactNode } from 'react';
import "../../../../../css/taskpanes/DefaultTaskpane.css"

/*
    A container for the footer content of a taskpane. Helpful for ensuring the footer is always 
    visible even if the body needs to scroll.
*/
const DefaultTaskpaneFooter = (
    props: {
        /** 
            * @param children - The actual content to display in the footer
        */
        children: ReactNode
        /** 
            * @param [ignoreTaskpanePadding] - If you want to escape the taskpane padding, then set this to true
        */
        ignoreTaskpanePadding?: boolean
    }): JSX.Element => {

    return (    
        <div style={props.ignoreTaskpanePadding ? {margin: ' 0px -10px -7px -14px'} : undefined}>  {/** Set a negative margin to escape the footer */}
            {props.children}
        </div>
    )
};

export default DefaultTaskpaneFooter;