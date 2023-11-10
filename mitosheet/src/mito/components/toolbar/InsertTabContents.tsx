// Copyright (c) Mito


import React from 'react'

import { ActionEnum } from '../../types';
import { Actions } from '../../utils/actions';
import ToolbarButton from './ToolbarButton';

export const InsertTabContents = (
    props: { actions: Actions; }): JSX.Element => {

    return (<div className='mito-toolbar-bottom'>
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Pivot]}
        />
        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Melt]}
                orientation='horizontal'
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Transpose]}
                orientation='horizontal'
            />
        </div>
        <div className='toolbar-vertical-line' />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Merge]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Concat_Dataframes]}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.AntiMerge]}
        />
        <div className='toolbar-vertical-line' />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Graph]}
        />
        <div className='mito-toolbar-icon-buttons'>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph_Scatter]}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph_Line]}
            />
        </div>
    </div>);
}