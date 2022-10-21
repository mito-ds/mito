// Copyright (c) Mito

import React from 'react';

// import css
import "../../css/ephemeral-message.css";
import { useDebouncedEffect } from '../hooks/useDebouncedEffect';
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

    useDebouncedEffect(() => {
        props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                ephemeralMessage: undefined
            }
        })
    }, [props.message], 5000)

    return (
        <p className={classNames('ephemeral-message-container', 'text-body-1')}>
            {props.message}
        </p>  
    );
};

export default EphemeralMessage;