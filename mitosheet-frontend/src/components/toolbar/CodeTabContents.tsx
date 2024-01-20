// Copyright (c) Mito


import React from 'react'

import ToolbarButton from './ToolbarButton';
import { ActionEnum, MitoEnterpriseConfigKey, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import CopyCodeIcon from '../icons/CopyCodeIcon';

export const CodeTabContents = (
    props: {
        actions: Actions;
        userProfile: UserProfile;
    }): JSX.Element => {

    const [clickedCopy, setClickedCopy] = React.useState(false);

    return (<div className='mito-toolbar-bottom'>
        <ToolbarButton
            onClick={() => {
                setClickedCopy(true);
                setTimeout(() => setClickedCopy(false), 5000);
            }}
            iconOverride={<CopyCodeIcon success={clickedCopy}/>}
            action={props.actions.buildTimeActions[ActionEnum.CopyCode]}
        />
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.CODEOPTIONS]}/>
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.CODESNIPPETS]}/>
        {props.userProfile.mitoConfig[MitoEnterpriseConfigKey.DISPLAY_SCHEDULING] && 
            <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.Schedule_Github]}/>
        }
    </div>);
}