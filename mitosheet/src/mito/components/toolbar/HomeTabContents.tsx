// Copyright (c) Mito


import React from 'react'

import ToolbarButton from './ToolbarButton';
import { getSelectedColumnIDsWithEntireSelectedColumn, getSelectedNumberSeriesColumnIDs } from '../endo/selectionUtils';
import { getDtypeSelectOptions } from '../taskpanes/ControlPanel/FilterAndSortTab/DtypeCard';
import Dropdown from '../elements/Dropdown';
import Select from '../elements/Select';
import { getColumnAppliedFormat, getColumnFormatDropdownItems } from '../../utils/format';
import { ActionEnum, AnalysisData, EditorState, GridState, SheetData, UIState, UserProfile } from '../../types';
import { MitoAPI, getRandomId } from '../../api/api';
import { Actions } from '../../utils/actions';
import DropdownItem from '../elements/DropdownItem';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { MITO_TOOLBAR_REDO_ID, MITO_TOOLBAR_UNDO_ID } from './Toolbar';

export const HomeTabContents = (
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

    // Add all the user defined importers
    props.actions.runtimeImportActionsList.map(action => {
        const longTitle = action.longTitle
        importDropdownItems.push(
            <DropdownItem title={longTitle} key={longTitle} onClick={() => {props.setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {
                        type: TaskpaneType.USERDEFINEDIMPORT,
                        importer_name: action.staticType
                    }
                }
            })}}/>
        )
    })

    return (<div className='mito-toolbar-bottom'>
        <div className='mito-toolbar-bottom-left-half'>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Import_Dropdown]}
                setEditorState={props.setEditorState}
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
                    // If there are any custom importers, we want to make the dropdown wider
                    width={props.actions.runtimeImportActionsList.length > 0 ? 'large' : 'medium'}
                >
                    {importDropdownItems}
                </Dropdown>
            </ToolbarButton>
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Export_Dropdown]}
                setEditorState={props.setEditorState}
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

            <div className='mito-toolbar-number-format'>
                <Select
                    className='mito-toolbar-number-format-select'
                    disabled={!!props.actions.buildTimeActions[ActionEnum.Precision_Decrease].isDisabled()}
                    value={getColumnAppliedFormat(props.sheetData, getSelectedNumberSeriesColumnIDs(props.gridState.selections, props.sheetData))}
                >
                    {getColumnFormatDropdownItems(props.gridState.sheetIndex, props.sheetData, getSelectedNumberSeriesColumnIDs(props.gridState.selections, props.sheetData), props.mitoAPI, props.closeOpenEditingPopups)}
                </Select>
                <div className='mito-toolbar-number-precision'>
                    <ToolbarButton
                        action={props.actions.buildTimeActions[ActionEnum.Precision_Decrease]}
                        setEditorState={props.setEditorState}
                    />
                    <ToolbarButton
                        action={props.actions.buildTimeActions[ActionEnum.Precision_Increase]}
                        setEditorState={props.setEditorState}
                    />
                </div>
            </div>
            <div className="toolbar-vertical-line" style={{ marginLeft: '5px'}}></div>

            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Add_Column]}
                highlightToolbarButton={props.highlightAddColButton}
                setEditorState={props.setEditorState}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Delete_Column]}
                setEditorState={props.setEditorState}

            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Change_Dtype]}
                setEditorState={props.setEditorState}
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
                action={props.actions.buildTimeActions[ActionEnum.Pivot]}
                highlightToolbarButton={props.highlightPivotTableButton}
                setEditorState={props.setEditorState}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Graph]}
                setEditorState={props.setEditorState}
            />
            {props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION && 
                <ToolbarButton
                    action={props.actions.buildTimeActions[ActionEnum.AI_TRANSFORMATION]}
                    setEditorState={props.setEditorState}
                />
            }
            {props.userProfile.mitoConfig.MITO_CONFIG_CODE_SNIPPETS?.MITO_CONFIG_CODE_SNIPPETS_URL !== undefined && 
                <ToolbarButton
                    action={props.actions.buildTimeActions[ActionEnum.CODESNIPPETS]}
                    setEditorState={props.setEditorState}
                />
            }
        </div>
        <div className='mito-toolbar-bottom-right-half'>
            <ToolbarButton
                id={MITO_TOOLBAR_UNDO_ID} // NOTE: this is used to click the undo button in plugin.tsx
                action={props.actions.buildTimeActions[ActionEnum.Undo]}
            />
            <ToolbarButton
                id={MITO_TOOLBAR_REDO_ID} // NOTE: this is used to click the redo button in plugin.tsx
                action={props.actions.buildTimeActions[ActionEnum.Redo]}
            />
            <ToolbarButton
                action={props.actions.buildTimeActions[ActionEnum.Clear]}
            />
        </div>
    </div>);
}