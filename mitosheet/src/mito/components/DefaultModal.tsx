/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';
import { UIState } from '../types';
import { classNames } from '../utils/classNames';
import XIcon from './icons/XIcon';
import { ModalEnum } from './modals/modals';
import Col from './layout/Col';
import Row from './layout/Row';

// import css
import "../../../css/default-modal.css"


/*
    DefaultModal is a higher-order component that
    takes a modal and a header, and displays it as a component.

    The modal has props
    - a header string to be shown at the top of the modal
    - a modalType to indicate the font color of the header string
    - a viewComponent, a react fragment which is the center segment of the modal. 
        ie: an input field or text
    - a buttons component, react divs which have onclick functions to apply functions. 
        the modal is designed to take either 1 or 2 buttons where the left button is always 
        the close button. 
    - a setUIState (optional) - if provided, then the modal will contain a close button in the top right corner
    - overlay (optional) - if true, then an overlay will be added in front of the sheet
*/
const DefaultModal = (
    props: {
        header: string;
        modalType: ModalEnum
        viewComponent?: React.ReactFragment;
        buttons: React.ReactFragment;
        setUIState?: React.Dispatch<React.SetStateAction<UIState>>;
        overlay?: boolean;
        wide?: boolean;
    }): JSX.Element => {

    const headerColor = props.modalType === ModalEnum.Error ? '#ED4747' : '#343434' 
    const displayOverlay = props.overlay !== undefined && props.overlay
    return (

        /*
            If the modal should be displayed above the overlay, then we add the overlay css class to the
            highest div we're creating. And then set the mito-modal-container as the next div. Otherwise, we set 
            the mito-modal-container as the highest div. 

            Applying the overlay: We make sure that when we apply the overlay, it has
            access to the entire height and width of Mito, without the constriction of the mito-modal-container. 

            Not applying an overlay: We need the highest div to have its placement and z-index set so that 
            we can position the modal above Mito. Thus, we make the mito-modal-container, the highest div
        */
        <div className={classNames({'mito-modal-container': !displayOverlay}, {'overlay': displayOverlay})}>
            <div className={classNames({'mito-modal-container': displayOverlay})}>
                <div className={classNames('mito-modal', {'modal-wide': props.wide})}>
                    {props.setUIState !== undefined && 
                        <Row justify='end'>
                            <Col offsetRight={.25}>
                                <div 
                                    className='default-taskpane-header-exit-button-div' 
                                    onClick={() => {
                                        // If we get here, the setUIState function should never be undefined, 
                                        // but we add this check so the compiler knows that!
                                        if (props.setUIState != undefined) {
                                            props.setUIState((prevUIState) => {
                                                return {
                                                    ...prevUIState,
                                                    currOpenModal: {type: ModalEnum.None}
                                                }
                                            })
                                        }
                                    }}
                                >
                                    <XIcon/>
                                </div>
                            </Col>
                        </Row>
                    }
                    <div className={classNames('mito-modal-header-text-div', 'text-color-mito-text', {'mt-25px': props.setUIState === undefined})} style={{color: headerColor}}>
                        <p className='text-align-center-important'>{props.header}</p>
                    </div>
                    {props.viewComponent &&
                        <div className="mito-modal-message">
                            {props.viewComponent}
                        </div>
                    }
                    
                    <div className="mito-modal-buttons">
                        {props.buttons}       
                    </div>
                </div> 
            </div>
        </div>
    )
};

export default DefaultModal;