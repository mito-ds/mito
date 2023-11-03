// Copyright (c) Mito


import React from 'react'

import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { MitoAPI } from '../../api/api';
import { Actions } from '../../utils/actions';
import ToolbarButton from './ToolbarButton';

export const InsertTabContents = (
    props: {
        mitoAPI: MitoAPI
        currStepIdx: number;
        lastStepIndex: number;
        highlightPivotTableButton: boolean;
        highlightAddColButton: boolean;
        actions: Actions;
        gridState: GridState;
        uiState: UIState;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        sheetData: SheetData;
        userProfile: UserProfile;
        setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        analysisData: AnalysisData,
        sheetIndex: number,
        closeOpenEditingPopups: () => void
    }): JSX.Element => {

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
        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph_Scatter]}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph_Line]}
            />
        </div>
    </div>);
}