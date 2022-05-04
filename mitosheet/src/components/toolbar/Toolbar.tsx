// Copyright (c) Mito

import React, { useState } from 'react';
import fscreen from 'fscreen';
import MitoAPI from '../../jupyter/api';
import ToolbarButton from './ToolbarButton';
import { ToolbarButtonType } from './utils';
import { Action, ActionEnum, GridState, SheetData, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { getColumnFormatDropdownItemsUsingSelections } from '../../utils/formatColumns';

// Import CSS
import "../../../css/toolbar.css"
import ToolbarEditDropdown from './ToolbarEditDropdown';
import ToolbarDataframesDropdown from './ToolbarDataframesDropdown';
import ToolbarMenu from './ToolbarMenu';
import ToolbarColumnsDropdown from './ToolbarColumnsDropdown';
import ToolbarGraphsDropdown from './ToolbarGraphsDropdown';
import ToolbarViewDropdown from './ToolbarViewDropdown';
import ToolbarHelpDropdown from './ToolbarHelpDropdown';

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
        sheetData: SheetData
    }): JSX.Element => {
    
    const [fullscreen, setFullscreen] = useState(false);
    fscreen.onfullscreenchange = () => {
        setFullscreen(!!fscreen.fullscreenElement)
        // TODO: full screen height is broken. Fix before merging this PR
        
        void props.mitoAPI.log(
            'button_toggle_fullscreen',
            {
                // Note that this is true when _end_ in fullscreen mode, and 
                // false when we _end_ not in fullscreen mode, which is much
                // more natural than the alternative
                fullscreen: !!fscreen.fullscreenElement
            }
        )
    };
    
    const catchup = () => {
        // Fast forwards to the most recent step, allowing editing
        void props.mitoAPI.log('click_catch_up')
        void props.mitoAPI.updateCheckoutStepByIndex(props.lastStepIndex);
    }

    return (
        <div className='toolbar-container'>
            <div className='toolbar-top'>
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
                    />
                </ToolbarMenu>
                <ToolbarMenu type='Graphs' uiState={props.uiState} setUIState={props.setUIState}>
                    <ToolbarGraphsDropdown
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
            <div className='toolbar-top-bottom-seperator'/>
            <div className='toolbar-bottom'>
                <div className='toolbar-bottom-left-half'>
                    <ToolbarButton
                        id='mito-undo-button' // NOTE: this is used to click the undo button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.UNDO}
                        buttonTitle={props.actions[ActionEnum.Undo].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Undo].tooltip}
                        onClick={props.actions[ActionEnum.Undo].actionFunction}
                    />
                    <ToolbarButton
                        id='mito-redo-button' // NOTE: this is used to click the redo button in plugin.tsx
                        toolbarButtonType={ToolbarButtonType.REDO}
                        buttonTitle={props.actions[ActionEnum.Redo].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Redo].tooltip}
                        onClick={props.actions[ActionEnum.Redo].actionFunction}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.CLEAR}
                        buttonTitle={props.actions[ActionEnum.Clear].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Clear].tooltip}
                        onClick={props.actions[ActionEnum.Clear].actionFunction}
                    />

                    <div className="toolbar-vertical-line"/>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.IMPORT}
                        buttonTitle={props.actions[ActionEnum.Import].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Import].tooltip}
                        onClick={props.actions[ActionEnum.Import].actionFunction}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.EXPORT}
                        buttonTitle={props.actions[ActionEnum.Export].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Export].tooltip}
                        onClick={props.actions[ActionEnum.Export].actionFunction}
                    />

                    <div className="toolbar-vertical-line"/>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.ADD_COL}
                        buttonTitle={props.actions[ActionEnum.Add_Column].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Add_Column].tooltip}
                        onClick={props.actions[ActionEnum.Add_Column].actionFunction}
                        highlightToolbarButton={props.highlightAddColButton}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.DEL_COL}
                        buttonTitle={props.actions[ActionEnum.Delete_Column].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Delete_Column].tooltip}
                        onClick={props.actions[ActionEnum.Delete_Column].actionFunction}
                    />

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.PIVOT}
                        buttonTitle={props.actions[ActionEnum.Pivot].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Pivot].tooltip}
                        onClick={props.actions[ActionEnum.Pivot].actionFunction}
                        highlightToolbarButton={props.highlightPivotTableButton}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.MERGE}
                        buttonTitle={props.actions[ActionEnum.Merge].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Merge].tooltip}
                        onClick={props.actions[ActionEnum.Merge].actionFunction}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.CONCAT}
                        buttonTitle={props.actions[ActionEnum.Concat_Sheets].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Concat_Sheets].tooltip}
                        onClick={props.actions[ActionEnum.Concat_Sheets].actionFunction}
                    />
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.DROP_DUPLICATES}
                        buttonTitle={props.actions[ActionEnum.Drop_Duplicates].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Drop_Duplicates].tooltip}
                        onClick={props.actions[ActionEnum.Drop_Duplicates].actionFunction}
                    />

                    <div className="toolbar-vertical-line"></div>
                    
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.GRAPH}
                        buttonTitle={props.actions[ActionEnum.Graph].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Graph].tooltip}
                        onClick={props.actions[ActionEnum.Graph].actionFunction}
                    />

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.FORMAT}
                        buttonTitle={props.actions[ActionEnum.Format].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Format].tooltip}
                        onClick={props.actions[ActionEnum.Format].actionFunction}
                        displayChildren={props.uiState.displayFormatToolbarDropdown}
                    >
                        <Dropdown
                            closeDropdown={() => 
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        displayFormatToolbarDropdown: false
                                    }
                                })
                            }
                        >
                            {getColumnFormatDropdownItemsUsingSelections(props.gridState, props.sheetData, props.mitoAPI)}
                        </Dropdown>
                    </ToolbarButton>

                </div>
                <div className='toolbar-bottom-right-half'>
                    {/* 
                        Only when we are not caught up do we display the fast forward button
                    */}
                    {props.currStepIdx !== props.lastStepIndex &&
                        <ToolbarButton
                            toolbarButtonType={ToolbarButtonType.CATCH_UP}
                            buttonTitle="CATCH UP"
                            buttonSubtext='Stop looking at a previous step and catch up to the most recent edit'
                            onClick={catchup}
                        />
                    }
                    <ToolbarButton
                        toolbarButtonType={ToolbarButtonType.STEPS}
                        buttonTitle={props.actions[ActionEnum.Steps].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Steps].tooltip}
                        onClick={props.actions[ActionEnum.Steps].actionFunction}
                    />

                    <div className="toolbar-vertical-line"></div>

                    <ToolbarButton
                        toolbarButtonType={fullscreen ? ToolbarButtonType.CLOSE_FULLSCREEN : ToolbarButtonType.OPEN_FULLSCREEN}
                        buttonTitle={props.actions[ActionEnum.Fullscreen].shortTitle}
                        buttonSubtext={props.actions[ActionEnum.Fullscreen].tooltip}
                        onClick={props.actions[ActionEnum.Fullscreen].actionFunction}
                    />
                </div>
            </div>
        </div>
    );
};

export default Toolbar;