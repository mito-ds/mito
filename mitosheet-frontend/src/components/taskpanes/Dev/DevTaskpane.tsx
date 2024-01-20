// Copyright (c) Mito

import React, { useEffect } from 'react';
import '../../../../css/taskpanes/Steps/StepTaskpane.css';
import { MitoAPI } from '../../../api/api';
import { UIState, UserProfile } from '../../../types';
import TextButton from '../../elements/TextButton';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';


export type DevTaskpaneProps = {
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI
    userProfile: UserProfile
};

/* 
    Taskpane containing useful utilities for doing development.
*/
function DevTaskpane(props: DevTaskpaneProps): JSX.Element {

    const [crashCount, setCrashCount] = React.useState(0)

    useEffect(() => {
        if (crashCount > 0) {
            throw new Error('Crash Mitosheet')
        }
    }, [crashCount])

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader
                header='Dev Taskpane'
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <TextButton
                    onClick={() => {
                        setCrashCount(prevCrashCount => prevCrashCount + 1)
                    }}
                    variant='light'
                >
                    Crash Mitosheet

                </TextButton>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default DevTaskpane;