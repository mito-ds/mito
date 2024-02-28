// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../../css/taskpanes/DefaultTaskpane.css"
import DefaultTaskpaneErrorBoundry from './DefaultTaskpaneErrorBoundry';
import { UIState } from '../../../types';
import { MitoAPI } from '../../..';

/*
    DefaultTaskpane is a higher-order component that usually takes a DefaultTaskpaneHeader
    and DefaultTaskpaneBody component as it's child.
*/
const DefaultTaskpane = (
    props: {
        children: ReactNode,
        ref?: React.RefObject<HTMLDivElement>,
        setUIState: React.Dispatch<React.SetStateAction<UIState>>,
        mitoAPI?: MitoAPI
    }): JSX.Element => {

    const firstChild = React.Children.toArray(props.children)[0];
    const reactNode = React.isValidElement(firstChild) ? firstChild : null;
    const headerProp = reactNode !== null ? reactNode.props.header : 'No header';

    return (
        <div className='default-taskpane-div' ref={props.ref}>
            <DefaultTaskpaneErrorBoundry
                setUIState={props.setUIState}
                mitoAPI={props.mitoAPI}
                taskpaneHeader={headerProp}
            >
                {props.children}
            </DefaultTaskpaneErrorBoundry>
        </div>
    )
};

export default DefaultTaskpane;