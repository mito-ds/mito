// Copyright (c) Mito

import React from 'react';
import fscreen from 'fscreen';
import MitoAPI from '../../jupyter/api';
import ToolbarButton from './ToolbarButton';
import { ToolbarButtonType } from './utils';
import { Action, ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import Dropdown from '../elements/Dropdown';
import { getColumnFormatDropdownItems } from '../../utils/format';

// Import CSS
import "../../../css/toolbar.css"
import ToolbarEditDropdown from './ToolbarEditDropdown';
import ToolbarDataframesDropdown from './ToolbarDataframesDropdown';
import ToolbarMenu from './ToolbarDropdownSelector';
import ToolbarColumnsDropdown from './ToolbarColumnsDropdown';
import ToolbarGraphsDropdown from './ToolbarGraphsDropdown';
import ToolbarViewDropdown from './ToolbarViewDropdown';
import ToolbarHelpDropdown from './ToolbarHelpDropdown';
import PlanButton from './PlanButton';
import ToolbarRowsDropdown from './ToolbarRowsDropdown.tsx';
import OpenOnboardingChecklist from './OpenChecklistButton';
import { isVariantB } from '../../utils/experiments';
import ToolbarFormatDropdown from './ToolbarFormatDropdown';
import { getSelectedNumberSeriesColumnIDs } from '../endo/selectionUtils';

const Toolbar = (
    props: {
        mitoAPI: MitoAPI
        currStepIdx: number;
        lastStepIndex: number;
        highlightPivotTableButton: boolean;
        highlightAddColButton: boolean;
        actions: Record<ActionEnum, Action>;
        mitoContainerRef: React.RefObject<HTMLDivElement>;
        gridState: GridState;
        setGridState: React.Dispatch<React.SetStateAction<GridState>>;
        uiState: UIState;
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
        sheetData: SheetData;
        userProfile: UserProfile;
        setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
        analysisData: AnalysisData
    }): JSX.Element => {
    

    return (
        <div className='toolbar-container'>
            <div className='toolbar-top'>
                <div className='toolbar-top-left'>
                    <ToolbarMenu type='Edit' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarEditDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Dataframes' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarDataframesDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Columns' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarColumnsDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Rows' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarRowsDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Graphs' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarGraphsDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Format' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarFormatDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='View' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarViewDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Help' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarHelpDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                        />
                    </ToolbarMenu>
                </div>
                <div className='flexbox-row' style={{gap: '10px'}}>
                    <OpenOnboardingChecklist
                        userProfile={props.userProfile}
                        setUIState={props.setUIState}
                        mitoAPI={props.mitoAPI}
                        analysisData={props.analysisData}
                    />
                    <PlanButton
                        userProfile={props.userProfile}
                        setUIState={props.setUIState}
                        mitoAPI={props.mitoAPI}
                    />
                </div>
            </div>
            <div className='toolbar-top-bottom-seperator'/>
            <div className='toolbar-bottom'>
                <div className='toolbar-bottom-left-half'>
                    <ToolbarButton
                        id='mito-undo-button' // NOTE: this is used to click the undo button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.UNDO}
                        action={props.actions[ActionEnum.Undo]}
                    />
                    <ToolbarButton
                        id='mito-redo-button' // NOTE: this is used to click the redo button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.REDO}
                        action={props.actions[ActionEnum.Redo]}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.CLEAR}
                        action={props.actions[ActionEnum.Clear]}
                    />

                    <div className="toolbar-vertical-line"/>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.IMPORT}
                        action={props.actions[ActionEnum.Import]}
                        setEditorState={props.setEditorState}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.EXPORT}
                        action={props.actions[ActionEnum.Export]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Export].isDisabled()}
                    />

                    <div className="toolbar-vertical-line"/>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.ADD_COL}
                        action={props.actions[ActionEnum.Add_Column]}
                        highlightToolbarButton={props.highlightAddColButton}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Add_Column].isDisabled()}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.DEL_COL}
                        action={props.actions[ActionEnum.Delete_Column]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Delete_Column].isDisabled()}

                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.DTYPE}
                        action={props.actions[ActionEnum.Change_Dtype]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Change_Dtype].isDisabled()}
                    />
                    <div className="toolbar-vertical-line"></div>
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.LESS}
                        action={props.actions[ActionEnum.Precision_Decrease]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Precision_Decrease].isDisabled()}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.MORE}
                        action={props.actions[ActionEnum.Precision_Increase]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Precision_Increase].isDisabled()}
                    />
                    
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.FORMAT}
                        action={props.actions[ActionEnum.Format_Number_Columns]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Format_Number_Columns].isDisabled()}
                    >
                        <Dropdown
                            display={props.uiState.displayFormatToolbarDropdown}
                            closeDropdown={() => 
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        displayFormatToolbarDropdown: false
                                    }
                                })
                            }
                        >
                            {getColumnFormatDropdownItems(props.gridState.sheetIndex, props.sheetData, getSelectedNumberSeriesColumnIDs(props.gridState.selections, props.sheetData), props.mitoAPI)}
                        </Dropdown>
                    </ToolbarButton>

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.PIVOT}
                        action={props.actions[ActionEnum.Pivot]}
                        highlightToolbarButton={props.highlightPivotTableButton}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Pivot].isDisabled()}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.GRAPH}
                        action={props.actions[ActionEnum.Graph]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={isVariantB(props.analysisData) ? undefined : props.actions[ActionEnum.Graph].isDisabled()}

                    />

                </div>
                <div className='toolbar-bottom-right-half'>
                    {/* 
                        Only when we are not caught up do we display the fast forward button
                    */}
                    {props.currStepIdx !== props.lastStepIndex &&
                        <ToolbarButton
                            toolbarButtonType={ToolbarButtonType.CATCH_UP}
                            action={props.actions[ActionEnum.Catch_Up]}
                        />
                    }
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.STEPS}
                        action={props.actions[ActionEnum.Steps]}
                    />

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        toolbarButtonType={fscreen.fullscreenElement ? ToolbarButtonType.CLOSE_FULLSCREEN : ToolbarButtonType.OPEN_FULLSCREEN}
                        action={props.actions[ActionEnum.Fullscreen]}
                    />
                </div>
            </div>
        </div>
    );
};

export default Toolbar;