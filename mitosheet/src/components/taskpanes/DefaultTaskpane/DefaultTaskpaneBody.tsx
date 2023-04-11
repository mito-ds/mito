// Copyright (c) Mito

import React, { ReactNode, useEffect } from 'react';
import "../../../../css/taskpanes/DefaultTaskpane.css";
import MitoAPI from '../../../jupyter/api';
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
         * @param [requiresPro] - Set to true if the taskpane requires Mito Pro
        */
        requiresPro?: boolean;

        /**
         * @param [requiresProMessage] - The message to display if the taskpane requires Mito Pro
        */
        requiresProMessage?: string;

        /**
         * @param [requiresEnterprise] - Set to true if the taskpane requires Mito Enterprise
        */
        requiresEnterprise?: boolean;

        /**
         * @param [requiresProMessage] - The message to display if the taskpane requires Mito Enterprise
        */
        requiresEnterpriseMessage?: string;

        /**
         * @param [mitoAPI] - The Mito API
        */
        mitoAPI?: MitoAPI;

        /**
         * @param [featureName] - Feautre name
        */
        featureName?: string;


    }): JSX.Element => {

    const shouldPromptProUpgrade = !props.userProfile?.isPro && props.requiresPro;
    const shouldPromptEnterpriseUpgrade = !props.userProfile?.isEnterprise && props.requiresEnterprise;

    useEffect(() => {
        if (shouldPromptProUpgrade && props.mitoAPI !== undefined) {
            void props.mitoAPI.log('prompted_pro_upgrade', {feature: props.featureName});
        }
    
        if (shouldPromptEnterpriseUpgrade && props.mitoAPI !== undefined) {
            void props.mitoAPI.log('prompted_enterprise_upgrade', {feature: props.featureName});
        }
    }, [])

    return (
        <>
            {shouldPromptProUpgrade &&
                <MitoUpgradePrompt
                    message={props.requiresProMessage}
                    proOrEnterprise='Pro'
                    mitoAPI={props.mitoAPI}
                    featureName={props.featureName}
                />
            }
            {shouldPromptEnterpriseUpgrade &&
                <MitoUpgradePrompt
                    message={props.requiresEnterpriseMessage}
                    proOrEnterprise='Enterprise'
                    mitoAPI={props.mitoAPI}
                    featureName={props.featureName}
                />
            }
            <div className={classNames('default-taskpane-body-div', {'default-taskpane-body-div-no-scroll' : props.noScroll, 'default-taskpane-body-disabled': shouldPromptProUpgrade || shouldPromptEnterpriseUpgrade})}> 
                {props.children}
            </div>
        </>
    )
};

export default DefaultTaskpaneBody;