// Copyright (c) Mito

import fscreen from 'fscreen';
import React from 'react';
import "../../../../css/toolbar.css";
import { MitoAPI,  getRandomId } from '../../api/api';
import { Action, ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { getColumnFormatDropdownItems } from '../../utils/format';
import Dropdown from '../elements/Dropdown';
import DropdownItem from '../elements/DropdownItem';
import { getSelectedColumnIDsWithEntireSelectedColumn, getSelectedNumberSeriesColumnIDs } from '../endo/selectionUtils';
import { getDtypeSelectOptions } from '../taskpanes/ControlPanel/FilterAndSortTab/DtypeCard';
import { TaskpaneType } from '../taskpanes/taskpanes';
import PlanButton from './PlanButton';
import ToolbarButton from './ToolbarButton';
import ToolbarColumnsDropdown from './ToolbarColumnsDropdown';
import ToolbarDataframesDropdown from './ToolbarDataframesDropdown';
import ToolbarMenu from './ToolbarDropdownSelector';
import ToolbarEditDropdown from './ToolbarEditDropdown';
import ToolbarFormatDropdown from './ToolbarFormatDropdown';
import ToolbarGraphsDropdown from './ToolbarGraphsDropdown';
import ToolbarHelpDropdown from './ToolbarHelpDropdown';
import ToolbarRowsDropdown from './ToolbarRowsDropdown.tsx';
import GetSupportButton from '../elements/GetSupportButton';
import ToolbarViewDropdown from './ToolbarViewDropdown';
import { ToolbarButtonType } from './utils';
import ToolbarCodeDropdown from './ToolbarCodeDropdown';

export const MITO_TOOLBAR_OPEN_SEARCH_ID = 'mito-open-search';
export const MITO_TOOLBAR_UNDO_ID = 'mito-undo-button';
export const MITO_TOOLBAR_REDO_ID = 'mito-redo-button';

export const Toolbar = (
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
        analysisData: AnalysisData,
        sheetIndex: number,
        closeOpenEditingPopups: () => void
    }): JSX.Element => {  


    const importDropdownItems: JSX.Element[] = [
        <DropdownItem title='Import Files' key='Import Files' onClick={() => {props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.IMPORT_FILES}
            }
        })}}/>,
        <DropdownItem title='Import Dataframes' key='Import Dataframes' onClick={() => {props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.DATAFRAMEIMPORT}
            }
        })}}/>,
    ]

    if (props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT) {
        importDropdownItems.push(
            <DropdownItem title='Import from Snowflake' key='Import from Snowflake' onClick={() => {props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {type: TaskpaneType.SNOWFLAKEIMPORT}
                }
            })}}/>
        )
    }

    importDropdownItems.push(
        <DropdownItem title='Custom Imports' key='Custom Imports' onClick={() => {props.setUIState(prevUIState => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.USERDEFINEDIMPORT}
            }
        })}}/>
    )

    return (
        <div className='mito-toolbar-container'>
            <div className='mito-toolbar-top'>
                <div className='mito-toolbar-top-left'>
                    <ToolbarMenu type='Edit' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarEditDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Dataframes' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarDataframesDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
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
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Graphs' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarGraphsDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Format' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarFormatDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Code' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarCodeDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='View' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarViewDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                    <ToolbarMenu type='Help' uiState={props.uiState} setUIState={props.setUIState}>
                        <ToolbarHelpDropdown
                            actions={props.actions}
                            uiState={props.uiState}
                            setUIState={props.setUIState}
                            userProfile={props.userProfile}
                        />
                    </ToolbarMenu>
                </div>
                <div className='mito-toolbar-top-right'>
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
            <div className='mito-toolbar-top-bottom-seperator'/>
            <div className='mito-toolbar-bottom'>
                <div className='mito-toolbar-bottom-left-half'>
                    <ToolbarButton
                        id={MITO_TOOLBAR_UNDO_ID} // NOTE: this is used to click the undo button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.UNDO}
                        action={props.actions[ActionEnum.Undo]}
                        disabledTooltip={props.actions[ActionEnum.Undo].isDisabled()}
                    />
                    <ToolbarButton
                        id={MITO_TOOLBAR_REDO_ID} // NOTE: this is used to click the redo button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.REDO}
                        action={props.actions[ActionEnum.Redo]}
                        disabledTooltip={props.actions[ActionEnum.Redo].isDisabled()}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.CLEAR}
                        action={props.actions[ActionEnum.Clear]}
                        disabledTooltip={props.actions[ActionEnum.Clear].isDisabled()}
                    />

                    <div className="toolbar-vertical-line"/>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.IMPORT}
                        action={props.actions[ActionEnum.Import_Dropdown]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Import_Dropdown].isDisabled()}
                    >
                        <Dropdown
                            display={props.uiState.toolbarDropdown === 'import'}
                            closeDropdown={() => 
                                props.setUIState(prevUIState => {
                                    if (prevUIState.toolbarDropdown !== 'import') {
                                        return prevUIState;
                                    }

                                    return {
                                        ...prevUIState,
                                        toolbarDropdown: undefined
                                    }
                                })
                            }
                            width='medium'
                        >
                            {importDropdownItems}
                        </Dropdown>
                    </ToolbarButton>
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.EXPORT}
                        action={props.actions[ActionEnum.Export_Dropdown]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Export_Dropdown].isDisabled()}
                    >
                        <Dropdown
                            display={props.uiState.toolbarDropdown === 'export'}
                            closeDropdown={() => 
                                props.setUIState(prevUIState => {
                                    if (prevUIState.toolbarDropdown !== 'export') {
                                        return prevUIState;
                                    }

                                    return {
                                        ...prevUIState,
                                        toolbarDropdown: undefined
                                    }
                                })
                            }
                            width='large'
                        >
                            <DropdownItem 
                                title='Download File Now' 
                                subtext='Download the file to your downloads folder.'
                                onClick={() => {props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenTaskpane: {type: TaskpaneType.DOWNLOAD}
                                    }
                                })
                                }}/>
                            <DropdownItem 
                                title='Download File when Executing Code' 
                                subtext='Download the file to the same folder as this notebook when you run the generated code.'
                                onClick={() => {props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        currOpenTaskpane: {type: TaskpaneType.EXPORT_TO_FILE}
                                    }
                                })
                                }}/>
                        </Dropdown>
                    </ToolbarButton>

                    <div className="toolbar-vertical-line"/>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.ADD_COL}
                        action={props.actions[ActionEnum.Add_Column]}
                        highlightToolbarButton={props.highlightAddColButton}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Add_Column].isDisabled()}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.DEL_COL}
                        action={props.actions[ActionEnum.Delete_Column]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Delete_Column].isDisabled()}

                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.DTYPE}
                        action={props.actions[ActionEnum.Change_Dtype]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Change_Dtype].isDisabled()}
                    >  
                        <Dropdown
                            display={props.uiState.toolbarDropdown === 'dtype'}
                            closeDropdown={() => 
                                props.setUIState(prevUIState => {
                                    if (prevUIState.toolbarDropdown !== 'dtype') {
                                        return prevUIState;
                                    }

                                    return {
                                        ...prevUIState,
                                        toolbarDropdown: undefined
                                    }
                                })
                            }
                            width='medium'
                            
                        >
                            {getDtypeSelectOptions((newDtype => {
                                const selectedColumnIDs = getSelectedColumnIDsWithEntireSelectedColumn(props.gridState.selections, props.sheetData);
                                void props.mitoAPI.editChangeColumnDtype(
                                    props.sheetIndex,
                                    selectedColumnIDs,
                                    newDtype,
                                    getRandomId()
                                )
                            }))}
                        </Dropdown>
                    </ToolbarButton>
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
                        disabledTooltip={props.actions[ActionEnum.Format_Number_Columns].isDisabled()}
                    >
                        <Dropdown
                            display={props.uiState.toolbarDropdown === 'format'}
                            closeDropdown={() => 
                                props.setUIState(prevUIState => {
                                    if (prevUIState.toolbarDropdown !== 'format') {
                                        return prevUIState;
                                    }

                                    return {
                                        ...prevUIState,
                                        toolbarDropdown: undefined
                                    }
                                })
                            }
                        >
                            {getColumnFormatDropdownItems(props.gridState.sheetIndex, props.sheetData, getSelectedNumberSeriesColumnIDs(props.gridState.selections, props.sheetData), props.mitoAPI, props.closeOpenEditingPopups)}
                        </Dropdown>
                    </ToolbarButton>

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.PIVOT}
                        action={props.actions[ActionEnum.Pivot]}
                        highlightToolbarButton={props.highlightPivotTableButton}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Pivot].isDisabled()}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.GRAPH}
                        action={props.actions[ActionEnum.Graph]}
                        setEditorState={props.setEditorState}
                        disabledTooltip={props.actions[ActionEnum.Graph].isDisabled()}
                    />
                    {props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION && 
                        <ToolbarButton
                            toolbarButtonType={ToolbarButtonType.AI_TRANSFORMATION}
                            action={props.actions[ActionEnum.AI_TRANSFORMATION]}
                            setEditorState={props.setEditorState}
                            disabledTooltip={props.actions[ActionEnum.AI_TRANSFORMATION].isDisabled()}
                        />
                    }
                    {props.userProfile.mitoConfig.MITO_CONFIG_CODE_SNIPPETS?.MITO_CONFIG_CODE_SNIPPETS_URL !== undefined && 
                        <ToolbarButton
                            toolbarButtonType={ToolbarButtonType.CODE_SNIPPETS}
                            action={props.actions[ActionEnum.CODESNIPPETS]}
                            setEditorState={props.setEditorState}
                            disabledTooltip={props.actions[ActionEnum.CODESNIPPETS].isDisabled()}
                        />
                    }
                </div>
                <div className='mito-toolbar-bottom-right-half'>
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
                        disabledTooltip={props.actions[ActionEnum.Steps].isDisabled()}
                    />

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        id={MITO_TOOLBAR_OPEN_SEARCH_ID} // NOTE: this is used to click the open search button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.OPEN_SEARCH}
                        action={props.actions[ActionEnum.OpenSearch]}
                    />
                    <ToolbarButton
                        toolbarButtonType={fscreen.fullscreenElement ? ToolbarButtonType.CLOSE_FULLSCREEN : ToolbarButtonType.OPEN_FULLSCREEN}
                        action={props.actions[ActionEnum.Fullscreen]}
                    />
                </div>
            </div>
        </div>
    );
};
