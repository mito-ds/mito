// Copyright (c) Mito


import React from 'react'

import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { MitoAPI } from '../../api/api';
import { Actions } from '../../utils/actions';
import ToolbarButton from './ToolbarButton';

export const DataTabContents = (
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
            action={props.actions.buildTimeActions[ActionEnum.Import_Files]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Dataframe_Import]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.SNOWFLAKEIMPORT]}
            setEditorState={props.setEditorState}
        />

        <div className='toolbar-vertical-line' />
        
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.UPDATEIMPORTS]}
            setEditorState={props.setEditorState}
        />
        
        <div className='toolbar-vertical-line' />

        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.SortAlphabetically]}
                setEditorState={props.setEditorState}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.SortAlphabeticallyReverse]}
                setEditorState={props.setEditorState}
            />
        </div>

        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Sort]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Filter]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Clear]}
            setEditorState={props.setEditorState}
        />

        <div className='toolbar-vertical-line' />

    </div>);
}