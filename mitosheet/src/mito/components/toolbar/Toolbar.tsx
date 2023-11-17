// Copyright (c) Mito

import fscreen from 'fscreen';
import React from 'react';
import "../../../../css/toolbar.css";
import { MitoAPI } from '../../api/api';
import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import { classNames } from '../../utils/classNames';
import GetSupportButton from '../elements/GetSupportButton';
import { CloseFullscreenIcon, OpenFullscreenIcon } from '../icons/FullscreenIcons';
import { CodeTabContents } from './CodeTabContents';
import { DataTabContents } from './DataTabContents';
import { FormulaTabContents } from './FormulaTabContents';
import { HomeTabContents } from './HomeTabContents';
import { InsertTabContents } from './InsertTabContents';
import PlanButton from './PlanButton';
import ToolbarButton from './ToolbarButton';
import CheckmarkIcon from '../icons/CheckmarkIcon';
import LoadingDots from '../elements/LoadingDots';
import EditIcon from '../icons/EditIcon';

export const MITO_TOOLBAR_OPEN_SEARCH_ID = 'mito-open-search';
export const MITO_TOOLBAR_UNDO_ID = 'mito-undo-button';
export const MITO_TOOLBAR_REDO_ID = 'mito-redo-button';

export type TabName = 'Home' | 'Insert' | 'Data' | 'Formulas' | 'Code';
type TabContents = JSX.Element;
type Tabs = {
    [ tab: string ]: TabContents
}

/* 
    Each toolbar button icon has both a light and dark option. 
    We use the light version when its on a dark background (ie: when 
    the toolbar button is hovered over), and the dark version when its 
    on a light background (ie: at rest). 
*/
export type IconVariant = 'light' | 'dark'

export const Toolbar = (
    props: {
        mitoAPI: MitoAPI
        currStepIdx: number;
        lastStepIndex: number;
        highlightPivotTableButton: boolean;
        highlightAddColButton: boolean;
        actions: Actions;
        mitoContainerRef: React.RefObject<HTMLDivElement>;
        gridState: GridState;
        setGridState: React.Dispatch<React.SetStateAction<GridState>>;
        uiState: UIState;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        sheetData: SheetData;
        userProfile: UserProfile;
        editorState: EditorState | undefined;
        setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        analysisData: AnalysisData,
        sheetIndex: number,
        closeOpenEditingPopups: () => void
    }): JSX.Element => {  
    
    const currentTab = props.uiState.currentToolbarTab;
    const tabs: Tabs = {
        'Home': <HomeTabContents {...props}/>,
        'Insert': <InsertTabContents {...props}/>,
        'Data': <DataTabContents {...props}/>,
        'Formulas': <FormulaTabContents {...props}/>,
        'Code': <CodeTabContents {...props}/>,
    };
    if (props.actions.runtimeEditActionsList.length > 0) {
        tabs['Custom Edits'] = <div className='mito-toolbar-bottom' id='mito-editor-tab'>
            {props.actions.runtimeEditActionsList.map((action) => {
                return <ToolbarButton
                    action={action}
                    key={action.staticType}
                    iconOverride={action.icon === undefined ? <EditIcon/> : undefined}
                />
            })}
        </div>
    }
    const isLoading = () => {
        if (props.uiState.loading.length > 0) {
            for (const loadingInfo of props.uiState.loading) {
                if (loadingInfo[1] !== undefined) {
                    return true
                }
            }
        }
        return false;
    }

    return (
        <div className='mito-toolbar-container'>
            <div className='mito-toolbar-top'>
                <div className='mito-toolbar-top-left'>
                    <ToolbarButton id={MITO_TOOLBAR_UNDO_ID} action={props.actions.buildTimeActions[ActionEnum.Undo]} />
                    <ToolbarButton id={MITO_TOOLBAR_REDO_ID} action={props.actions.buildTimeActions[ActionEnum.Redo]} />
                    <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.Clear]} />
                </div>
                <div className='mito-toolbar-top-right'>
                    {isLoading() ? 
                        <div className='mito-toolbar-save-indicator' style={{ justifyContent: 'center'}}>
                            <p>Saving</p>
                            <div style={{ width: '10px' }}>
                                <LoadingDots />
                            </div>
                        </div> :
                        <div className='mito-toolbar-save-indicator' title='All changes are saved automatically.'>
                            <p>Saved</p>
                            <CheckmarkIcon />
                        </div>
                    }
                    <ToolbarButton
                        id={MITO_TOOLBAR_OPEN_SEARCH_ID} // NOTE: this is used to click the open search button in plugin.tsx
                        action={props.actions.buildTimeActions[ActionEnum.OpenSearch]}
                    />
                    <ToolbarButton action={props.actions.buildTimeActions[ActionEnum.Steps]} />
                    <ToolbarButton
                        iconOverride={fscreen.fullscreenElement ? <CloseFullscreenIcon /> : <OpenFullscreenIcon />}
                        action={props.actions.buildTimeActions[ActionEnum.Fullscreen]}
                    />
                </div>
            </div>
            <div className='mito-toolbar-tabbar'>
                <div className='mito-toolbar-tabbar-left'>
                    {Object.keys(tabs).map((tab) => {
                        return <button
                            key={tab}
                            style={{ width: `${tab.length+2}ch` }}
                            onClick={() => {
                                if (currentTab === tab) {
                                    props.setUIState(prevUIState => {
                                        return {
                                            ...prevUIState,
                                            currentToolbarTab: undefined
                                        }
                                    })
                                    return
                                }
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currentToolbarTab: tab as TabName
                                    }
                                })
                            }}
                            className={classNames('mito-toolbar-tabbar-tabname', currentTab === tab ? 'mito-toolbar-tabbar-tabname-selected' : '')}
                        >
                            <span>{tab}</span>
                            {currentTab === tab && <div className='mito-toolbar-tabbar-selected-underline'/>}
                        </button>
                    })}
                </div>
                <div className='mito-toolbar-tabbar-right'>
                    <GetSupportButton 
                        userProfile={props.userProfile} 
                        setUIState={props.setUIState} 
                        mitoAPI={props.mitoAPI} 
                        width='hug-contents'
                        className='mito-plan-button'
                    />
                    <PlanButton
                        uiState={props.uiState}
                        userProfile={props.userProfile}
                        setUIState={props.setUIState}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
            </div>
            {currentTab !== undefined ? tabs[currentTab] ?? <div> No tab found </div> : undefined}
        </div>
    );
};
