/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';
import "../../../../../css/taskpanes/DefaultTaskpane.css"
import { UIState } from '../../../types';
import XIcon from '../../icons/XIcon';
import { TaskpaneType } from '../taskpanes';
import BackArrowIcon from '../../icons/BackArrowIcon';
import Row from '../../layout/Row';
import Col from '../../layout/Col';

/*
    A container for the main header of a taskpane, with some helpful props to 
    make common header actions easy. Usually wrapped in a DefaultTaskpane.
*/
const DefaultTaskpaneHeader = (
    props: {
        /** 
            * @param header - The actual content to display in the header
        */
        header: string;
        /** 
         * @param setUIState - sets the UI state of Mito
         */
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        /** 
            * @param [backCallback] - If you want to add a back button to the title of the taskpane, 
            * you can just provide a callback to be called when this is clicked
        */
        backCallback?: () => void;
        /** 
            * @param [callbackOnClose] -  If you want to run a function when the taskpane
            closes (e.g. for specific logging reasons), use this
        */
        callbackOnClose?: () => void;
        /** 
            * @param [notCloseable] -  If you want the taskpane to not be closeable, then
            set this prop to true
        */
        notCloseable?: boolean;
        
    }): JSX.Element => {

    return (
        <div className='default-taskpane-header-div'>
            <Row suppressTopBottomMargin>
                <Col span={23}>
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
                </Col>
                <Col>
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
        </div>
    )
};

export default DefaultTaskpaneHeader;