// Copyright (c) Mito

import React from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css"
import { UIState } from '../../../types';
import XIcon from '../../icons/XIcon';
import { TaskpaneType } from '../taskpanes';
import BackArrowIcon from '../../icons/BackArrowIcon';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';

/*
    DefaultTaskpane is a higher-order component that
    takes a header and a taskpaneBbody, and displays it as a component.

    The modal has props
    - a header string to be shown at the top of the taskpane
    - a taskpaneBody, a react fragment which is the center segment of the taskpane
    - a setTaskpaneOpenOrClosed function to close the taskpane
*/
const DefaultTaskpane = (
    props: {
        header: string | JSX.Element;
        // If you want the header to not be put inside the row and possibly wrap
        headerOutsideRow?: boolean; 
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        /* 
            If you want to add a back button to the title of the taskpane, 
            you can just provide a callback to be called when this is clicked
        */
        backCallback?: () => void;

        /* 
            If you want to run a function when the taskpane
            closes (e.g. for specific logging reasons), use this
        */
        callbackOnClose?: () => void;
        /* 
            If you want the taskpane to not be closeable, then
            set this prop to true
        */
        notCloseable?: boolean;
        
    }): JSX.Element => {

    return (
        <div className='default-taskpane-header-div'>
            {props.headerOutsideRow &&
                props.header                
            }
            {!props.headerOutsideRow &&
                <Row suppressTopBottomMargin>
                    <Col span={23}>
                        {typeof props.header !== 'string' &&
                            props.header
                        }
                        {typeof props.header === 'string' &&
                            <div className='default-taskpane-header-and-back-button'>
                                {props.backCallback !== undefined &&
                                    <div onClick={props.backCallback} className='mt-5px mr-10px'>
                                        <BackArrowIcon/>
                                    </div>
                                }
                                <p className='text-header-2 text-overflow-hide'>
                                    {props.header}
                                </p>
                            </div>
                        }
                    </Col>
                    <Col span={1}>
                        {!props.notCloseable &&
                            <div 
                                className='default-taskpane-header-exit-button-div' 
                                onClick={() => {
                                    // Call the on close callback, if it exists
                                    if (props.callbackOnClose) {
                                        props.callbackOnClose();
                                    }
                                    props.setUIState((prevUIState) => {
                                        return {
                                            ...prevUIState,
                                            currOpenTaskpane: {type: TaskpaneType.NONE}
                                        }
                                    })
                                }}
                            >
                                <XIcon/>
                            </div>
                        } 
                    </Col>
                </Row>
            }           
        </div>
    )
};

export default DefaultTaskpane;