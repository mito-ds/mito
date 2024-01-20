// Copyright (c) Mito

import React, { useEffect } from 'react';

// import css
import "../../../css/popups/ephemeral-message.css";
import { PopupLocation, PopupType, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import DefaultPopup from '../elements/DefaultPopup';
import XIcon from '../icons/XIcon';
import Row from '../layout/Row';

/*
    A popup that displays a message to the user and then disaspears either after 5 seconds or when the user 
    closes the popup. 
*/
const EphemeralMessage = (props: {
    message: string,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    popupLocation: PopupLocation
}): JSX.Element => {

    const closePopup = () => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenPopups: {
                    ...prevUIState.currOpenPopups,
                    [props.popupLocation]: {type: PopupType.None}
                }
            }
        })
    }

    // This effect tracks the message we're displaying and closes the ephemeral message after
    // 6 seconds. If the message changes within those 6 seconds, it changes to the new message
    // and restarts the countdown. Resetting the interval will stop the animation, but the popup will still
    // appear and dissapear at the correct times.
    useEffect(() => {
        const interval = setInterval(() => {
            closePopup()
        }, 6000) // <- This 6000 should correspond to the 5s + 1s buffer in the ephemeral-message-animation class in ephemeral-message.css
        return () => {clearInterval(interval)};
    }, [props.message])
    
    return (
        <DefaultPopup popupLocation={props.popupLocation} className='ephemeral-message-animation'>
            <Row className={classNames('ephemeral-message-container')} align='center' suppressTopBottomMargin>
                <p className={classNames('text-body-1', 'text-color-background-important', 'mr-10px')}>
                    {props.message}
                </p> 
                <div
                    className='mt-5px ml-5px'
                    onClick={() => closePopup()}
                >
                    <XIcon />
                </div>
            </Row>
        </DefaultPopup>
    );
};

export default EphemeralMessage;