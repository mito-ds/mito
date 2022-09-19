// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css";
import { UserProfile } from '../../../types';
import { classNames } from '../../../utils/classNames';
import MitoProUpgradePrompt from '../../elements/MitoProUpgradePrompt';

/*
    A container for the main content of a taskpane. Usually wrapped in 
    a DefaultTaskpane.
*/
const DefaultTaskpaneBody = (
    props: {
        /** 
            * @param children - The actual content to display in the body
        */
        children: ReactNode
        /** 
            * @param [noScroll] - Set to true if you don't want the body to be scrollable
        */
        noScroll?: boolean;

        /**
         * @param [userProfile] - The user profile of the current user
        */
        userProfile?: UserProfile;

        /**
         * @param [requiresPro] - Set to true if the taskpane requires Mito Pro
        */
        requiresPro?: boolean;

        /**
         * @param [requiresProMessage] - The message to display if the taskpane requires Mito Pro
        */
        requiresProMessage?: string;

    }): JSX.Element => {

    const promptUpgrade = !props.userProfile?.isPro && props.requiresPro;

    return (
        <>
            {promptUpgrade &&
                <MitoProUpgradePrompt
                    message={props.requiresProMessage}
                />
            }
            <div className={classNames('default-taskpane-body-div', {'default-taskpane-body-div-no-scroll' : props.noScroll, 'default-taskpane-body-disabled': promptUpgrade})}> 
                {props.children}
            </div>
        </>
    )
};

export default DefaultTaskpaneBody;