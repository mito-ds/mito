// Copyright (c) Mito

import React, { ReactNode } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css";
import { MitoAPI } from '../../../api/api';
import { UserProfile } from '../../../types';
import { classNames } from '../../../utils/classNames';
import MitoUpgradePrompt from '../../elements/MitoProUpgradePrompt';

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
         * @param [requiresPro] - Set fields if the taskpane requires a pro liscence
        */
        requiresPro?: {
            message?: string,
            featureName: string,
            mitoAPI: MitoAPI
        }

        /**
         * @param [requiresEnterprise] - Set fields if the taskpane requires an enterprise liscence
        */
        requiresEnterprise?: {
            message?: string,
            featureName: string,
            mitoAPI: MitoAPI
        }

        /**
         * @param [setRef] - A callback to set the ref
         **/
        setRef?: (ref: HTMLDivElement) => void;

    }): JSX.Element => {

    const shouldPromptProUpgrade = !props.userProfile?.isPro && props.requiresPro !== undefined;
    const shouldPromptEnterpriseUpgrade = !props.userProfile?.isEnterprise && props.requiresEnterprise !== undefined;

    return (
        <>
            {!props.userProfile?.isPro && props.requiresPro !== undefined &&
                <MitoUpgradePrompt
                    message={props.requiresPro.message}
                    proOrEnterprise='Pro'
                    mitoAPI={props.requiresPro.mitoAPI}
                    featureName={props.requiresPro.featureName}
                />
            }
            {!props.userProfile?.isEnterprise && props.requiresEnterprise !== undefined &&
                <MitoUpgradePrompt
                    message={props.requiresEnterprise.message}
                    proOrEnterprise='Enterprise'
                    mitoAPI={props.requiresEnterprise.mitoAPI}
                    featureName={props.requiresEnterprise.featureName}
                />
            }
            <div 
                className={classNames('default-taskpane-body-div', {'default-taskpane-body-div-no-scroll' : props.noScroll, 'default-taskpane-body-disabled': shouldPromptProUpgrade || shouldPromptEnterpriseUpgrade})}
                ref={props.setRef}
            > 
                {props.children}
            </div>
        </>
    )
};

export default DefaultTaskpaneBody;