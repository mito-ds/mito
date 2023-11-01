// Copyright (c) Mito


import React from 'react'

import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { MitoAPI } from '../../api/api';
import { Actions } from '../../utils/actions';
import ToolbarButton from './ToolbarButton';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';

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

        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Split_Text_To_Column]}
            setEditorState={props.setEditorState}
        />
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.Drop_Duplicates]}
            setEditorState={props.setEditorState}
        />
        <div>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Fill_Na]}
                setEditorState={props.setEditorState}
                orientation='horizontal'
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.One_Hot_Encoding]}
                setEditorState={props.setEditorState}
                orientation='horizontal'
            />
        </div>
        <ToolbarButton
            action={props.actions.buildTimeActions[ActionEnum.RESET_INDEX_DROPDOWN]}
            setEditorState={props.setEditorState}
        >
            <Dropdown
                display={props.uiState.toolbarDropdown === 'reset-index'}
                closeDropdown={() => 
                    props.setUIState(prevUIState => {
                        if (prevUIState.toolbarDropdown !== 'reset-index') {
                            return prevUIState;
                        }

                        return {
                            ...prevUIState,
                            toolbarDropdown: undefined
                        }
                    })
                }
                // If there are any custom importers, we want to make the dropdown wider
                width={props.actions.runtimeImportActionsList.length > 0 ? 'large' : 'medium'}
            >
                <DropdownItem
                    title='Reset and Keep Index'
                    key='reset-and-keep-index'
                    onClick={props.actions.buildTimeActions[ActionEnum.RESET_AND_KEEP_INDEX].actionFunction}
                />
                <DropdownItem
                    title='Reset and Drop Index'
                    key='reset-and-drop-index'
                    onClick={props.actions.buildTimeActions[ActionEnum.RESET_AND_DROP_INDEX].actionFunction}
                />
            </Dropdown>
        </ToolbarButton>
            

    </div>);
}