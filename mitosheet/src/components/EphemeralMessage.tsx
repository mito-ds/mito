// Copyright (c) Mito

import React, { useEffect } from 'react';

// import css
import "../../css/ephemeral-message.css";
import { UIState } from '../types';
import { classNames } from '../utils/classNames';

/*
    Displays a message to the user in the bottom left hand corner of their screen, and then 
    disapears by itself after 5 seconds
*/
const EphemeralMessage = (props: {
    message: string,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
}): JSX.Element => {

    // This effect tracks the message we're displaying and closes the ephemeral message after
    // 5 seconds. If the message changes within those 5 seconds, it changes to the new message
    // and restarts the countdown. 
    useEffect(() => {
        const interval = setInterval(() => {
            props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    ephemeralMessage: undefined
                }
            })
        }, 5000)
        return () => {clearInterval(interval)};
    }, [props.message])

    return (
        <p className={classNames('ephemeral-message-container', 'text-body-1')}>
            {props.message}
        </p>  
    );
};

export default EphemeralMessage;