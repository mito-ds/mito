// Copyright (c) Mito


import React from 'react'

import ToolbarButton from './ToolbarButton';
import { ActionEnum } from '../../types';
import { Actions } from '../../utils/actions';

export const CodeTabContents = (
    props: {
        actions: Actions;
    }): JSX.Element => {

    return (<div className='mito-toolbar-bottom'>
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.CODEOPTIONS]}/>
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.CODESNIPPETS]}/>
        <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.CopyCode]}/>
    </div>);
}