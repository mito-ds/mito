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
            setEditorState={props.setEditorState}
        />
        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Melt]}
                setEditorState={props.setEditorState}
                orientation='horizontal'
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Transpose]}
                setEditorState={props.setEditorState}
                orientation='horizontal'
            />
        </div>
        <div className='toolbar-vertical-line' />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Merge]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Concat_Dataframes]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.AntiMerge]}
            setEditorState={props.setEditorState}
        />
        <div className='toolbar-vertical-line' />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Graph]}
            setEditorState={props.setEditorState}
        />
        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph_Scatter]}
                setEditorState={props.setEditorState}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph_Line]}
                setEditorState={props.setEditorState}
            />
        </div>
    </div>);
}