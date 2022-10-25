// Copyright (c) Mito

import React, { useEffect } from 'react';

// import css
import "../../../css/popups/ephemeral-message.css";
import { PopupLocation, PopupType, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import DefaultPopup from '../elements/DefaultPopup';

/*
    A popup that displays a message to the user and then disaspears either after 5 seconds or when the user 
    closes the popup. 
*/
const EphemeralMessage = (props: {
    message: string,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    popupLocation: PopupLocation
}): JSX.Element => {

    // This effect tracks the message we're displaying and closes the ephemeral message after
    // 5 seconds. If the message changes within those 5 seconds, it changes to the new message
    // and restarts the countdown. 
    useEffect(() => {
        const interval = setInterval(() => {
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenPopups: {
                        ...prevUIState,
                        [props.popupLocation]: {type: PopupType.None}
                    }
                }
            })
        }, 5000)
        return () => {clearInterval(interval)};
    }, [props.message])

    
    return (
        <DefaultPopup popupLocation={props.popupLocation}>
            <p className={classNames('ephemeral-message-container', 'text-body-1')}>
                {props.message}
            </p>  
        </DefaultPopup>
    );
};

export default EphemeralMessage;