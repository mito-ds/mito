import React from 'react'
import { DISCORD_INVITE_LINK } from '../../data/documentationLinks';
import { MitoAPI } from '../../api/api';
import { UIState, UserProfile } from '../../types';
import { classNames } from '../../utils/classNames';
import { ModalEnum } from '../modals/modals';
import { Width } from './sizes.d';
import TextButton from './TextButton';

export const DEFAULT_SUPPORT_EMAIL = 'founders@sagacollab.com'

interface GetSupportButtonProps {
    userProfile: UserProfile,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    mitoAPI?: MitoAPI
    className?: string
    width?: Width
}

/*
    This Get Support button sends you to the correct support option for your configuration.
    If the mitoConfig support email is set to a custom email, it opens an email, otherwise, it opens Slack. 
*/
const GetSupportButton = (props: GetSupportButtonProps): JSX.Element => {

    return (
        <TextButton 
            className={classNames(props.className, 'cursor-pointer')}
            variant='dark'
            width={props.width || 'hug-contents'}
            href={props.userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL === DEFAULT_SUPPORT_EMAIL ? DISCORD_INVITE_LINK : `mailto:${props.userProfile.mitoConfig.MITO_CONFIG_SUPPORT_EMAIL}?subject=Mito support request`}
            target='_blank'
            onClick={() => {
                props.setUIState((prevUIState) => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None}
                    }
                })
                void props.mitoAPI?.log('clicked_get_support_button')
                return true;
            }}
        >
            Help
        </TextButton>
    )
}

export default GetSupportButton;