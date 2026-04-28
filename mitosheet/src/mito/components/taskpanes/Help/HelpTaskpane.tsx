/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect } from 'react';
import { MitoAPI } from '../../../api/api';
import { UIState, UserProfile } from '../../../types';
import { DISCORD_INVITE_LINK } from '../../../data/documentationLinks';
import { DEFAULT_SUPPORT_EMAIL } from '../../elements/GetSupportButton';
import TextButton from '../../elements/TextButton';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';

interface HelpTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
}

const HelpTaskpane = (props: HelpTaskpaneProps): JSX.Element => {

    useEffect(() => {
        void props.mitoAPI.log('opened_help_taskpane');
    }, [])

    const supportHref = props.userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL === DEFAULT_SUPPORT_EMAIL
        ? DISCORD_INVITE_LINK
        : `mailto:${props.userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL}?subject=Mito support request`;

    const isPro = props.userProfile.isPro;
    const isEnterprise = props.userProfile.isEnterprise;

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header='Help'
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <div className='flexbox-column' style={{gap: '20px', padding: '4px 0'}}>
                    <div className='flexbox-column' style={{gap: '8px'}}>
                        <p className='text-header-3'>Get Support</p>
                        <p className='text-body-1'>
                            Join the Mito community on Discord for help, tips, and feature requests.
                        </p>
                        <TextButton
                            variant='dark'
                            width='block'
                            href={supportHref}
                            target='_blank'
                            onClick={() => {
                                void props.mitoAPI.log('clicked_get_support_button');
                                return true;
                            }}
                        >
                            {props.userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL === DEFAULT_SUPPORT_EMAIL
                                ? 'Join Discord'
                                : 'Contact Support'}
                        </TextButton>
                    </div>
                    <div className='flexbox-column' style={{gap: '8px'}}>
                        <p className='text-header-3'>Your Plan</p>
                        {(isPro || isEnterprise) ? (
                            <>
                                <p className='text-body-1'>
                                    {isEnterprise ? "You're on Mito Enterprise." : "You're on Mito Pro."} Thanks for your support!
                                </p>
                                <TextButton
                                    variant='default'
                                    width='block'
                                    onClick={() => {
                                        props.setUIState(prev => ({
                                            ...prev,
                                            currOpenTaskpane: {
                                                type: TaskpaneType.UPGRADE_TO_PRO,
                                                proOrEnterprise: isEnterprise ? 'Enterprise' : 'Pro'
                                            }
                                        }));
                                        return true;
                                    }}
                                >
                                    {isEnterprise ? 'Mito Enterprise' : 'Mito Pro'}
                                </TextButton>
                            </>
                        ) : (
                            <>
                                <p className='text-body-1'>
                                    Upgrade to Mito Pro to unlock advanced features like AI, scheduling, and more.
                                </p>
                                <TextButton
                                    variant='dark'
                                    width='block'
                                    onClick={() => {
                                        void props.mitoAPI.log('clicked_plan_button');
                                        props.setUIState(prev => ({
                                            ...prev,
                                            currOpenTaskpane: {
                                                type: TaskpaneType.UPGRADE_TO_PRO,
                                                proOrEnterprise: 'Pro'
                                            }
                                        }));
                                        return true;
                                    }}
                                >
                                    Upgrade to Mito Pro
                                </TextButton>
                            </>
                        )}
                    </div>
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    );
}

export default HelpTaskpane;
